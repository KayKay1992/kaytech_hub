const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const AlumniContactMessage = require('../models/AlumniContactMessage');
const Notification = require('../models/Notification');
const { getForumAccess } = require('../utils/forumAccess');

const MESSAGE_MAX_LENGTH = 2000;

const FORUM_TYPES = ['student', 'alumni'];
const AUTHOR_FIELDS = 'name photo_url role';

const isValidForumType = (forumType) => FORUM_TYPES.includes(forumType);

// GET /api/forums/access — drives which forum links a student sees in the
// sidebar, and lets the client pre-empt a 403 with a friendly message.
const getAccess = async (req, res) => {
  try {
    const access = await getForumAccess(req.user);
    res.json(access);
  } catch (err) {
    res.status(500).json({ message: 'Failed to check forum access', error: err.message });
  }
};

// GET /api/forums/:forumType/posts
const listPosts = async (req, res) => {
  try {
    const { forumType } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const posts = await ForumPost.find({ forum_type: forumType, status: 'active' })
      .sort({ created_at: -1 })
      .populate('author_id', AUTHOR_FIELDS);

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const reply_count = await ForumReply.countDocuments({ post_id: post._id, status: 'active' });
        return { ...post.toObject(), reply_count };
      })
    );

    res.json({ posts: postsWithCounts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load posts', error: err.message });
  }
};

// POST /api/forums/:forumType/posts
const createPost = async (req, res) => {
  try {
    const { forumType } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await ForumPost.create({ forum_type: forumType, author_id: req.user._id, content });
    await post.populate('author_id', AUTHOR_FIELDS);

    res.status(201).json({ post: { ...post.toObject(), reply_count: 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
};

// GET /api/forums/:forumType/posts/:postId
const getPost = async (req, res) => {
  try {
    const { forumType, postId } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const post = await ForumPost.findOne({ _id: postId, forum_type: forumType, status: 'active' })
      .populate('author_id', AUTHOR_FIELDS);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const replies = await ForumReply.find({ post_id: post._id, status: 'active' })
      .sort({ created_at: 1 })
      .populate('author_id', AUTHOR_FIELDS);

    res.json({ post, replies });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load post', error: err.message });
  }
};

// POST /api/forums/:forumType/posts/:postId/replies
const createReply = async (req, res) => {
  try {
    const { forumType, postId } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const post = await ForumPost.findOne({ _id: postId, forum_type: forumType, status: 'active' });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const reply = await ForumReply.create({ post_id: post._id, author_id: req.user._id, content });
    await reply.populate('author_id', AUTHOR_FIELDS);

    res.status(201).json({ reply });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create reply', error: err.message });
  }
};

// GET /api/forums/alumni/directory — same access rule as the Alumni Forum.
// Strict opt-in: only users with show_in_alumni_directory=true AND at least
// one live Certificate (never cached) ever appear, regardless of role.
const getAlumniDirectory = async (req, res) => {
  try {
    const access = await getForumAccess(req.user);
    if (!access.alumni.allowed) {
      return res.status(403).json({ message: access.alumni.message });
    }

    const optedIn = await User.find(
      { show_in_alumni_directory: true, forum_ban_alumni: false },
      'name photo_url current_role current_company alumni_bio'
    );
    if (optedIn.length === 0) {
      return res.json({ alumni: [] });
    }

    const certificates = await Certificate.find({ student_id: { $in: optedIn.map((u) => u._id) } })
      .populate({ path: 'cohort_id', select: 'course_id', populate: { path: 'course_id', select: 'title' } });

    const coursesByUser = new Map();
    certificates.forEach((cert) => {
      const title = cert.cohort_id?.course_id?.title;
      if (!title) return;
      const key = String(cert.student_id);
      if (!coursesByUser.has(key)) coursesByUser.set(key, new Set());
      coursesByUser.get(key).add(title);
    });

    let alumni = optedIn
      .filter((u) => coursesByUser.has(String(u._id)))
      .map((u) => ({
        _id: u._id,
        name: u.name,
        photo_url: u.photo_url,
        current_role: u.current_role,
        current_company: u.current_company,
        alumni_bio: u.alumni_bio,
        courses: Array.from(coursesByUser.get(String(u._id))),
      }));

    const search = (req.query.search || '').trim();
    if (search) {
      const pattern = new RegExp(search, 'i');
      alumni = alumni.filter((a) => pattern.test(a.name) || a.courses.some((c) => pattern.test(c)));
    }

    res.json({ alumni });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load the alumni directory', error: err.message });
  }
};

// POST /api/forums/alumni/directory/:userId/message — "Reach Me". Any
// Alumni Forum member can message any user who's actually reachable in the
// directory (opted in AND still holds a Certificate) — never an arbitrary
// account, keeping this scoped to directory context rather than a general
// inbox. Delivered as a Notification (target_type: 'specific_user') so it
// shows up on the recipient's normal Notifications page.
const sendAlumniMessage = async (req, res) => {
  try {
    const access = await getForumAccess(req.user);
    if (!access.alumni.allowed) {
      return res.status(403).json({ message: access.alumni.message });
    }

    const { userId } = req.params;
    if (userId === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot message yourself' });
    }

    const message = (req.body.message || '').trim();
    if (!message) {
      return res.status(400).json({ message: 'A message is required' });
    }
    if (message.length > MESSAGE_MAX_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer` });
    }

    const recipient = await User.findById(userId);
    if (!recipient || !recipient.show_in_alumni_directory) {
      return res.status(404).json({ message: 'This alumnus is not reachable via the directory' });
    }
    const hasCertificate = await Certificate.exists({ student_id: recipient._id });
    if (!hasCertificate) {
      return res.status(404).json({ message: 'This alumnus is not reachable via the directory' });
    }

    await AlumniContactMessage.create({
      from_user_id: req.user._id,
      to_user_id: recipient._id,
      message,
    });

    const includeEmail = req.body.include_email === true || req.body.include_email === 'true';
    const notificationBody = includeEmail
      ? `${message}\n\n— ${req.user.name} included their email so you can reply directly: ${req.user.email}`
      : message;

    const notification = await Notification.create({
      sender_id: req.user._id,
      title: `Message from ${req.user.name} via Alumni Directory`,
      message: notificationBody,
      target_type: 'specific_user',
      target_user_id: recipient._id,
    });

    res.status(201).json({ message: 'Message sent', notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

module.exports = { getAccess, listPosts, createPost, getPost, createReply, getAlumniDirectory, sendAlumniMessage };
