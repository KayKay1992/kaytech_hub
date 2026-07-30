import { useReducedMotion } from 'framer-motion';
import useTypingLoop from '../../hooks/useTypingLoop';

const LINES = [
  '> kaytech.frontend_dev.enroll()',
  '> kaytech.ai_integration.deploy()',
  '> kaytech.cybersecurity.secure()',
];

export default function Terminal() {
  const prefersReducedMotion = useReducedMotion();
  const text = useTypingLoop(LINES, prefersReducedMotion);

  return (
    <div className="terminal" aria-hidden="true">
      <div className="terminal__bar">
        <span className="terminal__dot terminal__dot--red" />
        <span className="terminal__dot terminal__dot--yellow" />
        <span className="terminal__dot terminal__dot--green" />
        <span className="terminal__label">kaytech — zsh</span>
      </div>
      <div className="terminal__body">
        <span className="terminal__line">
          {text}
          <span className="terminal__cursor" />
        </span>
      </div>
    </div>
  );
}
