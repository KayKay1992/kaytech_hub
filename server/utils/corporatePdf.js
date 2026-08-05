// Corporate Training pipeline PDFs (pdfkit) — clean, text-based documents
// for proposals and invoices that admin downloads and sends to clients
// manually (same lightweight approach as certificatePdf.js).

const PDFDocument = require('pdfkit');

const formatMoney = (n) => `NGN ${Number(n || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const buildProposalPdf = ({ companyName, contactPersonName, title, scopeDescription, price, validUntil }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).text('Training Proposal', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#5B6072').text(`Prepared for ${companyName}`, { align: 'left' });
    doc.fillColor('#000000');
    doc.moveDown(1.5);

    doc.fontSize(16).text(title);
    doc.moveDown(1);

    doc.fontSize(11).text(`Contact: ${contactPersonName}`);
    doc.text(`Valid until: ${formatDate(validUntil)}`);
    doc.moveDown(1);

    doc.fontSize(13).text('Scope of Work');
    doc.moveDown(0.3);
    doc.fontSize(11).text(scopeDescription, { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(13).text('Investment');
    doc.moveDown(0.3);
    doc.fontSize(16).text(formatMoney(price));
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#5B6072').text('This proposal is offered for planning purposes. Payment is arranged offline (bank transfer/cash) once accepted.', { align: 'left' });

    doc.end();
  });
};

const buildInvoicePdf = ({ invoiceNumber, companyName, contactPersonName, description, amount, dueDate, createdAt }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).text('Invoice', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#5B6072').text(`Invoice #${invoiceNumber}`, { align: 'left' });
    doc.fillColor('#000000');
    doc.moveDown(1.5);

    doc.fontSize(13).text('Billed To');
    doc.fontSize(11).text(companyName);
    doc.text(`Attn: ${contactPersonName}`);
    doc.moveDown(1);

    doc.fontSize(11).text(`Invoice date: ${formatDate(createdAt || new Date())}`);
    doc.text(`Due date: ${formatDate(dueDate)}`);
    doc.moveDown(1.5);

    doc.fontSize(13).text('Description');
    doc.moveDown(0.3);
    doc.fontSize(11).text(description, { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(13).text('Amount Due');
    doc.moveDown(0.3);
    doc.fontSize(18).text(formatMoney(amount));
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#5B6072').text('Payment is offline (bank transfer/cash). Please reference the invoice number when paying.', { align: 'left' });

    doc.end();
  });
};

module.exports = { buildProposalPdf, buildInvoicePdf };
