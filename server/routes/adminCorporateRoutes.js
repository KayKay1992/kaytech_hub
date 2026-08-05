const express = require('express');
const {
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
} = require('../controllers/adminCorporateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/corporate-training/requests', listRequests);
router.get('/corporate-training/requests/:id', getRequest);
router.patch('/corporate-training/requests/:id', updateRequest);
router.get('/corporate-training/requests/:id/proposals', listProposals);
router.post('/corporate-training/requests/:id/proposals', createProposal);
router.post('/corporate-training/requests/:id/convert', convertToClient);

router.patch('/corporate-training/proposals/:id', updateProposalStatus);

router.get('/corporate-training/revenue', getCorporateRevenue);
router.get('/corporate-training/clients', listClients);
router.get('/corporate-training/clients/:id', getClient);
router.patch('/corporate-training/clients/:id', updateClientStatus);
router.get('/corporate-training/clients/:id/invoices', listInvoices);
router.post('/corporate-training/clients/:id/invoices', createInvoice);

router.patch('/corporate-training/invoices/:id/paid', markInvoicePaid);

module.exports = router;
