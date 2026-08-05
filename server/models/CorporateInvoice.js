const mongoose = require('mongoose');

const INVOICE_STATUSES = ['unpaid', 'paid'];
// Same vocabulary as ServicePayment.PAYMENT_METHODS — kept as its own copy
// since CorporateInvoice isn't a ServicePayment and shouldn't import from
// the Hub's model file.
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];

const corporateInvoiceSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CorporateClient', required: true },
  invoice_number: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  due_date: { type: Date, required: true },
  status: { type: String, enum: INVOICE_STATUSES, default: 'unpaid' },
  payment_method: { type: String, enum: PAYMENT_METHODS, default: null },
  paid_at: { type: Date, default: null },
  pdf_url: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

corporateInvoiceSchema.index({ client_id: 1 });

module.exports = mongoose.model('CorporateInvoice', corporateInvoiceSchema);
module.exports.INVOICE_STATUSES = INVOICE_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
