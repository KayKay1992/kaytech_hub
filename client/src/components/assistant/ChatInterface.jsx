import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../api/axios';

// Shared chat UI for both the Student "AI Tutor" and Instructor "AI Lesson
// Assistant" — same message bubbles, input box, and send button for both;
// only the page around it (title, placeholder, empty-state copy) differs.
// The server derives which system prompt to use from the caller's role, so
// this component doesn't need to know which context it's rendering for.
export default function ChatInterface({ placeholder, emptyMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/assistant/history')
      .then((res) => setMessages(res.data.messages))
      .catch(() => setError('Failed to load chat history'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Disabled while `sending` is true — the main guard against burning
  // free-tier quota on rapid repeated sends.
  const handleSend = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setError('');
    setInput('');

    try {
      const res = await api.post('/assistant/chat', { message: content });
      setMessages((prev) => [...prev, res.data.userMessage, res.data.assistantMessage]);
    } catch (err) {
      const data = err.response?.data;
      // The server still persists the user's message even when the AI call
      // fails, so it isn't lost — just shown without a reply underneath it.
      if (data?.userMessage) {
        setMessages((prev) => [...prev, data.userMessage]);
      }
      setError(data?.message || 'Something went wrong sending your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="assistant-chat">
      <div className="assistant-chat__messages">
        {loading ? (
          <p className="payments-empty">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="assistant-chat__empty">
            <Bot size={32} aria-hidden="true" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={`assistant-bubble assistant-bubble--${m.role}`}>
              <span className="assistant-bubble__icon" aria-hidden="true">
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </span>
              <div className="assistant-bubble__content">
                {m.role === 'assistant' ? (
                  <div className="assistant-markdown">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{m.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="assistant-bubble assistant-bubble--assistant assistant-bubble--typing">
            <span className="assistant-bubble__icon" aria-hidden="true"><Bot size={16} /></span>
            <div className="assistant-bubble__content">
              <span className="assistant-typing-dots"><span /><span /><span /></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="form-error assistant-chat__error">{error}</p>}

      <form className="assistant-chat__composer" onSubmit={handleSend}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          rows={2}
          maxLength={4000}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button type="submit" className="btn btn--primary" disabled={sending || !input.trim()}>
          <Send size={16} aria-hidden="true" />
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
