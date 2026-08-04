import ListPageHeader from '../../components/common/ListPageHeader';
import ChatInterface from '../../components/assistant/ChatInterface';

export default function StudentAssistant() {
  return (
    <section className="section section--flush-top">
      <span className="badge badge--ai">AI Tutor</span>
      <ListPageHeader
        title="AI Tutor"
        subtitle="Ask about any course concept — web development, AI, data analysis, cybersecurity, design, and more."
      />
      <ChatInterface
        placeholder="Ask your AI Tutor a question..."
        emptyMessage="Stuck on a concept? Ask your AI Tutor anything about your courses."
      />
    </section>
  );
}
