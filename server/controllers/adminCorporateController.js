const CorporateTrainingRequest = require('../models/CorporateTrainingRequest');
const CorporateProposal = require('../models/CorporateProposal');
const CorporateClient = require('../models/CorporateClient');
const CorporateInvoice = require('../models/CorporateInvoice');
const { uploadFile } = require('../utils/upload');
const { buildProposalPdf, buildInvoicePdf } = require('../utils/corporatePdf');

const { PIPELINE_STAGES } = CorporateTrainingRequest;
const { PROPOSAL_STATUSES } = CorporateProposal;
const { CLIENT_STATUSES } = CorporateClient;
const { PAYMENT_METHODS } = CorporateInvoice;

// ─── Pipeline requests ──────────────────────────────────────────────────

// GET /api/admin/corporate-training/requests?stage=
const listRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.stage) filter.stage = req.query.stage;
    const requests = await CorporateTrainingRequest.find(filter).sort({ created_at: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load corporate training requests', error: err.message });
  }
};

// GET /api/admin/corporate-training/requests/:id
const getRequest = async (req, res) => {
  try {
    const request = await CorporateTrainingRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load request', error: err.message });
  }
};

// PATCH /api/admin/corporate-training/requests/:id — move pipeline stage and/or edit internal notes
const updateRequest = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    if (stage && !PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ message: `Stage must be one of: ${PIPELINE_STAGES.join(', ')}` });
    }

    const request = await CorporateTrainingRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (stage !== undefined) request.stage = stage;
    if (notes !== undefined) request.notes = notes;
    await request.save();

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};

// ─── Proposals ──────────────────────────────────────────────────────────

// GET /api/admin/corporate-training/requests/:id/proposals
const listProposals = async (req, res) => {
  try {
    const proposals = await CorporateProposal.find({ request_id: req.params.id }).sort({ created_at: -1 });
    res.json({ proposals });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load proposals', error: err.message });
  }
};

// POST /api/admin/corporate-training/requests/:id/proposals — generates and stores a PDF
const createProposal = async (req, res) => {
  try {
    const request = await CorporateTrainingRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const { title, scope_description, price, valid_until } = req.body;
    if (!title || !scope_description || !price || !valid_until) {
      return res.status(400).json({ message: 'Title, scope description, price, and valid-until date are required' });
    }
    if (Number(price) <= 0) {
      return res.status(400).json({ message: 'Please enter a valid price' });
    }

    const pdfBuffer = await buildProposalPdf({
      companyName: request.company_name,
      contactPersonName: request.contact_person_name,
      title,
      scopeDescription: scope_description,
      price,
      validUntil: valid_until,
    });
    const { url } = await uploadFile(
      { originalname: `proposal-${request._id}-${Date.now()}.pdf`, buffer: pdfBuffer, mimetype: 'application/pdf' },
      'corporate-proposals'
    );

    const proposal = await CorporateProposal.create({
      request_id: request._id,
      title,
      scope_description,
      price,
      valid_until,
      pdf_url: url,
    });

    // Sending a proposal is a natural stage transition — only nudge the
    // pipeline forward if it hasn't already moved further along.
    if (request.stage === 'new' || request.stage === 'contacted') {
      request.stage = 'proposal_sent';
      await request.save();
    }

    res.status(201).json({ proposal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create proposal', error: err.message });
  }
};

// PATCH /api/admin/corporate-training/proposals/:id
const updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!PROPOSAL_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PROPOSAL_STATUSES.join(', ')}` });
    }

    const proposal = await CorporateProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    proposal.status = status;
    await proposal.save();

    res.json({ proposal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update proposal', error: err.message });
  }
};

// ─── Convert to client ──────────────────────────────────────────────────

// POST /api/admin/corporate-training/requests/:id/convert — requires an accepted proposal
const convertToClient = async (req, res) => {
  try {
    const request = await CorporateTrainingRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const acceptedProposal = await CorporateProposal.findOne({ request_id: request._id, status: 'accepted' });
    if (!acceptedProposal) {
      return res.status(400).json({ message: 'This request needs an accepted proposal before it can be converted to a client' });
    }

    const existingClient = await CorporateClient.findOne({ source_request_id: request._id });
    if (existingClient) {
      return res.status(400).json({ message: 'This request has already been converted to a client' });
    }

    const client = await CorporateClient.create({
      company_name: request.company_name,
      contact_person_name: request.contact_person_name,
      contact_email: request.contact_email,
      contact_phone: request.contact_phone,
      source_request_id: request._id,
    });

    if (request.stage !== 'won') {
      request.stage = 'won';
      await request.save();
    }

    res.status(201).json({ client });
  } catch (err) {
    res.status(500).json({ message: 'Failed to convert request to client', error: err.message });
  }
};

// ─── Clients ────────────────────────────────────────────────────────────

// GET /api/admin/corporate-training/clients — each client carries
// `outstanding_amount` (sum of its unpaid invoices) so the list page can
// flag at a glance who has unpaid invoices, without clicking into every
// client's detail page.
const listClients = async (req, res) => {
  try {
    const [clients, outstandingByClient] = await Promise.all([
      CorporateClient.find().sort({ created_at: -1 }),
      CorporateInvoice.aggregate([
        { $match: { status: 'unpaid' } },
        { $group: { _id: '$client_id', total: { $sum: '$amount' } } },
      ]),
    ]);

    const outstandingMap = new Map(outstandingByClient.map((o) => [String(o._id), o.total]));
    const clientsWithOutstanding = clients.map((c) => {
      const obj = c.toObject();
      obj.outstanding_amount = outstandingMap.get(String(c._id)) || 0;
      return obj;
    });

    res.json({ clients: clientsWithOutstanding });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load clients', error: err.message });
  }
};

// GET /api/admin/corporate-training/clients/:id
const getClient = async (req, res) => {
  try {
    const client = await CorporateClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ client });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load client', error: err.message });
  }
};

// PATCH /api/admin/corporate-training/clients/:id — active/inactive
const updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status && !CLIENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${CLIENT_STATUSES.join(', ')}` });
    }

    const client = await CorporateClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    if (status !== undefined) client.status = status;
    await client.save();

    res.json({ client });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update client', error: err.message });
  }
};

// ─── Invoices ───────────────────────────────────────────────────────────

const buildInvoiceNumber = async () => {
  const count = await CorporateInvoice.countDocuments();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// GET /api/admin/corporate-training/clients/:id/invoices
const listInvoices = async (req, res) => {
  try {
    const invoices = await CorporateInvoice.find({ client_id: req.params.id }).sort({ created_at: -1 });
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load invoices', error: err.message });
  }
};

// POST /api/admin/corporate-training/clients/:id/invoices — generates and stores a PDF
const createInvoice = async (req, res) => {
  try {
    const client = await CorporateClient.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { description, amount, due_date } = req.body;
    if (!description || !amount || !due_date) {
      return res.status(400).json({ message: 'Description, amount, and due date are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount' });
    }

    const invoice_number = await buildInvoiceNumber();
    const created_at = new Date();

    const pdfBuffer = await buildInvoicePdf({
      invoiceNumber: invoice_number,
      companyName: client.company_name,
      contactPersonName: client.contact_person_name,
      description,
      amount,
      dueDate: due_date,
      createdAt: created_at,
    });
    const { url } = await uploadFile(
      { originalname: `invoice-${invoice_number}.pdf`, buffer: pdfBuffer, mimetype: 'application/pdf' },
      'corporate-invoices'
    );

    const invoice = await CorporateInvoice.create({
      client_id: client._id,
      invoice_number,
      description,
      amount,
      due_date,
      created_at,
      pdf_url: url,
    });

    res.status(201).json({ invoice });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create invoice', error: err.message });
  }
};

// PATCH /api/admin/corporate-training/invoices/:id/paid — offline payment received
const markInvoicePaid = async (req, res) => {
  try {
    const { payment_method, paid_at } = req.body;
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` });
    }

    const invoice = await CorporateInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'This invoice is already marked paid' });
    }

    invoice.status = 'paid';
    invoice.payment_method = payment_method;
    invoice.paid_at = paid_at || new Date();
    await invoice.save();

    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark invoice as paid', error: err.message });
  }
};

// GET /api/admin/corporate-training/revenue — sum of every paid
// CorporateInvoice across all clients. This is the module's own dedicated
// revenue figure for the Corporate Training admin pages; it's also folded
// into the Services stat card/combined total on the Services page and main
// Admin Dashboard (see adminServiceController/adminDashboardController) —
// same money counted from two views, not a second bucket.
const getCorporateRevenue = async (req, res) => {
  try {
    const [{ total } = { total: 0 }] = await CorporateInvoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load corporate training revenue', error: err.message });
  }
};

module.exports = {
  listRequests,
  getRequest,
  updateRequest,
  listProposals,
  createProposal,
  updateProposalStatus,
  convertToClient,
  listClients,
  getClient,
  updateClientStatus,
  listInvoices,
  createInvoice,
  getCorporateRevenue,
  markInvoicePaid,
};
