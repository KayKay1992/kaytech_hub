// Placeholder certificate PDF generation (pdfkit). Deliberately bare-bones —
// name, course, date only — real template design happens after launch.

const PDFDocument = require('pdfkit');

const buildCertificatePdf = ({ studentName, courseTitle, issuedAt }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(28).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text('This certifies that', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(22).text(studentName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('has successfully completed', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(20).text(courseTitle, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).text(`Date: ${issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.end();
  });
};

module.exports = { buildCertificatePdf };
