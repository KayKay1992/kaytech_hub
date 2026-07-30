// Shared Cloudflare R2 (S3-compatible) upload utility.
// Every feature that needs to store a file (course images, blog images,
// scholarship documents, certificates, etc.) should import from here
// instead of writing its own S3/multer setup.

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT_URL,
  // R2 doesn't support virtual-hosted-style bucket addressing the way S3
  // does — without this, presigned URLs get signed against a bucket.account
  // subdomain that R2 rejects (surfaces as a misleading "RequestTimeTooSkewed").
  forcePathStyle: true,
  // Newer SDK versions default to flexible-checksum request/response
  // handling, which adds an x-amz-checksum-mode param R2 doesn't support —
  // same misleading "RequestTimeTooSkewed" error on presigned URLs. R2 only
  // needs the classic SigV4 signature.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

// R2_ENDPOINT_URL is the private S3 API endpoint, not a public URL.
// Set R2_PUBLIC_URL (custom domain or the bucket's r2.dev URL) once it's
// configured in Cloudflare, and returned URLs will use it automatically.
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT_URL}/${BUCKET}`;

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (PDFs/documents)

const buildKey = (originalName, folder) => {
  const ext = path.extname(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  return folder ? `${folder}/${uniqueName}` : uniqueName;
};

const putObject = async (buffer, key, mimetype) => {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));
  return `${PUBLIC_BASE_URL}/${key}`;
};

// Uploads any file type (PDFs, documents, etc). `file` is a multer file object.
// `folder` groups files in the bucket, e.g. 'certificates', 'scholarship-docs'.
const uploadFile = async (file, folder = 'files') => {
  if (!file) throw new Error('No file provided');
  const key = buildKey(file.originalname, folder);
  const url = await putObject(file.buffer, key, file.mimetype);
  return { url, key };
};

// Uploads an image, validating mime type and size before sending to R2.
const uploadImage = async (file, folder = 'images') => {
  if (!file) throw new Error('No file provided');
  if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid image type. Allowed: JPEG, PNG, WEBP, GIF');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image exceeds the 5MB size limit');
  }
  const key = buildKey(file.originalname, folder);
  const url = await putObject(file.buffer, key, file.mimetype);
  return { url, key };
};

const deleteFile = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

// For sensitive files (resumes, etc.) that shouldn't be permanently public —
// generates a temporary signed URL directly from R2's private API, valid
// for `expiresIn` seconds (default 5 minutes). No R2_PUBLIC_URL needed.
const getSignedFileUrl = async (key, expiresIn = 300) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};

// Recovers the R2 object key from a URL this module generated, so callers
// that only stored the "public" URL can still request a signed one.
const keyFromUrl = (url) => {
  if (!url || !url.startsWith(PUBLIC_BASE_URL)) return null;
  return url.slice(PUBLIC_BASE_URL.length + 1);
};

// Multer middlewares — attach to routes as `upload.single('file')` or `uploadImage.single('image')`.
// Files are kept in memory so uploadFile/uploadImage can stream the buffer straight to R2.
const fileUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const imageUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid image type. Allowed: JPEG, PNG, WEBP, GIF'));
    }
    cb(null, true);
  },
});

module.exports = {
  uploadFile,
  uploadImage,
  deleteFile,
  getSignedFileUrl,
  keyFromUrl,
  fileUploadMiddleware,
  imageUploadMiddleware,
};
