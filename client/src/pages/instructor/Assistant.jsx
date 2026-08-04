import ListPageHeader from '../../components/common/ListPageHeader';
import ChatInterface from '../../components/assistant/ChatInterface';

export default function InstructorAssistant() {
  return (
    <section className="section section--flush-top">
      <span className="badge badge--ai">AI Lesson Assistant</span>
      <ListPageHeader
        title="AI Lesson Assistant"
        subtitle="Draft lesson notes, outlines, explanations, and exercise ideas for the courses you teach."
      />
      <ChatInterface
        placeholder="Ask for a lesson outline, explanation, or exercise idea..."
        emptyMessage="Describe the lesson or topic you're building and your AI Lesson Assistant will help you draft it."
      />
    </section>
  );
}
