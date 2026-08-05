import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import StatusPill from '../../../components/admin/StatusPill';
import Modal from '../../../components/common/Modal';

const STAGES = ['new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost'];
const STAGE_LABELS = {
  new: 'New', contacted: 'Contacted', proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating', won: 'Won', lost: 'Lost',
};
const TRAINING_TYPE_LABELS = {
  staff_training: 'Staff Training', ai_training: 'AI Training',
  software_training: 'Software Training', other: 'Other',
};
const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'rejected'];
const PROPOSAL_STATUS_TONE = { draft: 'slate', sent: 'amber', accepted: 'teal', rejected: 'danger' };

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const emptyProposalForm = { title: '', scope_description: '', price: '', valid_until: '' };

export default function AdminCorporateTrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stageSaving, setStageSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [creatingProposal, setCreatingProposal] = useState(false);
  const [proposalForm, setProposalForm] = useState(emptyProposalForm);
  const [proposalError, setProposalError] = useState('');
  const [proposalSaving, setProposalSaving] = useState(false);
  const [proposalStatusBusyId, setProposalStatusBusyId] = useState(null);

  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [requestRes, proposalsRes] = await Promise.all([
        api.get(`/admin/corporate-training/requests/${id}`),
        api.get(`/admin/corporate-training/requests/${id}/proposals`),
      ]);
      setRequest(requestRes.data.request);
      setNotes(requestRes.data.request.notes || '');
      setProposals(proposalsRes.data.proposals);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStageChange = async (stage) => {
    setStageSaving(true);
    setError('');
    try {
      const res = await api.patch(`/admin/corporate-training/requests/${id}`, { stage });
      setRequest(res.data.request);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setStageSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setError('');
    setNotesSaved(false);
    try {
      const res = await api.patch(`/admin/corporate-training/requests/${id}`, { notes });
      setRequest(res.data.request);
      setNotesSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    setProposalError('');
    const { title, scope_description, price, valid_until } = proposalForm;
    if (!title || !scope_description || !price || !valid_until) {
      setProposalError('Please fill in all fields.');
      return;
    }
    if (Number(price) <= 0) {
      setProposalError('Please enter a valid price.');
      return;
    }
    setProposalSaving(true);
    try {
      const res = await api.post(`/admin/corporate-training/requests/${id}/proposals`, proposalForm);
      setProposals((prev) => [res.data.proposal, ...prev]);
      setCreatingProposal(false);
      setProposalForm(emptyProposalForm);
      const requestRes = await api.get(`/admin/corporate-training/requests/${id}`);
      setRequest(requestRes.data.request);
    } catch (err) {
      setProposalError(err.response?.data?.message || 'Failed to create proposal');
    } finally {
      setProposalSaving(false);
    }
  };

  const handleProposalStatusChange = async (proposalId, status) => {
    setProposalStatusBusyId(proposalId);
    setError('');
    try {
      const res = await api.patch(`/admin/corporate-training/proposals/${proposalId}`, { status });
      setProposals((prev) => prev.map((p) => (p._id === proposalId ? res.data.proposal : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update proposal status');
    } finally {
      setProposalStatusBusyId(null);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    setConvertError('');
    try {
      const res = await api.post(`/admin/corporate-training/requests/${id}/convert`);
      navigate(`/admin/corporate-clients/${res.data.client._id}`);
    } catch (err) {
      setConvertError(err.response?.data?.message || 'Failed to convert request to client');
    } finally {
      setConverting(false);
    }
  };

  const hasAcceptedProposal = useMemo(() => proposals.some((p) => p.status === 'accepted'), [proposals]);

  if (loading) {
    return <div className="admin-dashboard"><p className="payments-empty">Loading request...</p></div>;
  }
  if (!request) {
    return <div className="admin-dashboard"><p className="form-error">{error || 'Request not found'}</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>{request.company_name}</h1>
            <p className="admin-dashboard__subtitle">
              <Link to="/admin/corporate-training">&larr; Back to Corporate Training</Link>
            </p>
          </div>
          <StatusPill tone={{ new: 'amber', contacted: 'teal', proposal_sent: 'teal', negotiating: 'teal', won: 'teal', lost: 'danger' }[request.stage]}>
            {STAGE_LABELS[request.stage]}
          </StatusPill>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="card-grid card-grid--two" style={{ marginTop: 8 }}>
        <div className="card">
          <h3>Request Details</h3>
          <p><strong>Contact:</strong> {request.contact_person_name}</p>
          <p><strong>Email:</strong> {request.contact_email}</p>
          <p><strong>Phone:</strong> {request.contact_phone}</p>
          <p><strong>Training type:</strong> {TRAINING_TYPE_LABELS[request.training_type] || request.training_type}</p>
          {request.number_of_participants && <p><strong>Participants:</strong> ~{request.number_of_participants}</p>}
          {request.preferred_timeline && <p><strong>Preferred timeline:</strong> {request.preferred_timeline}</p>}
          <p><strong>Message:</strong> {request.message}</p>
          <p className="payments-muted">Submitted {new Date(request.created_at).toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Pipeline Stage</h3>
          <label>
            Stage
            <select value={request.stage} disabled={stageSaving} onChange={(e) => handleStageChange(e.target.value)}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </label>

          <label style={{ marginTop: 16 }}>
            Internal notes
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Internal notes about this lead..."
            />
          </label>
          <button type="button" className="btn btn--ghost" disabled={notesSaving} onClick={handleSaveNotes} style={{ marginTop: 8 }}>
            {notesSaving ? 'Saving...' : notesSaved ? 'Saved' : 'Save Notes'}
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 8px' }}>Convert to Client</h4>
            {convertError && <p className="form-error">{convertError}</p>}
            <p className="payments-muted">
              {hasAcceptedProposal
                ? 'A proposal has been accepted — this lead can now become an ongoing client.'
                : 'Requires at least one accepted proposal.'}
            </p>
            <button type="button" className="btn btn--primary btn--full" disabled={!hasAcceptedProposal || converting} onClick={handleConvert}>
              {converting ? 'Converting...' : 'Convert to Client'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-page-header" style={{ marginTop: 32 }}>
        <div><h2 style={{ margin: 0 }}>Proposals</h2></div>
        <button type="button" className="btn btn--primary" onClick={() => setCreatingProposal(true)}>New Proposal</button>
      </div>

      <div className="invite-table-wrap">
        {proposals.length === 0 ? (
          <p className="payments-empty">No proposals created yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p._id}>
                  <td>{p.title}</td>
                  <td>{money(p.price)}</td>
                  <td className="payments-date">{new Date(p.valid_until).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={p.status}
                      disabled={proposalStatusBusyId === p._id}
                      onChange={(e) => handleProposalStatusChange(p._id, e.target.value)}
                    >
                      {PROPOSAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="payments-date">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <a href={p.pdf_url} target="_blank" rel="noreferrer" className="btn btn--ghost">Download PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creatingProposal && (
        <Modal title={`New Proposal: ${request.company_name}`} onClose={() => setCreatingProposal(false)}>
          <form className="auth-form" onSubmit={handleCreateProposal}>
            {proposalError && <p className="form-error">{proposalError}</p>}

            <label>
              Title
              <input
                type="text"
                value={proposalForm.title}
                onChange={(e) => setProposalForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. AI Training Program for 20 Staff"
                required
              />
            </label>

            <label>
              Scope of work
              <textarea
                rows={4}
                value={proposalForm.scope_description}
                onChange={(e) => setProposalForm((f) => ({ ...f, scope_description: e.target.value }))}
                required
              />
            </label>

            <label>
              Price (₦)
              <input
                type="number" min="0" step="0.01"
                value={proposalForm.price}
                onChange={(e) => setProposalForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </label>

            <label>
              Valid until
              <input
                type="date"
                value={proposalForm.valid_until}
                onChange={(e) => setProposalForm((f) => ({ ...f, valid_until: e.target.value }))}
                required
              />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={proposalSaving}>
              {proposalSaving ? 'Generating PDF...' : 'Create Proposal'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
