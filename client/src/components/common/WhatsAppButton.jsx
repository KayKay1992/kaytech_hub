import { motion, useReducedMotion } from 'framer-motion';

// Floating click-to-chat button, public pages only (mounted in PublicLayout).
// Number comes from VITE_WHATSAPP_NUMBER so it can change without a code edit.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;
const STARTER_MESSAGE = "Hi! I'm interested in learning more about KayTech Hub.";

export default function WhatsAppButton() {
  const prefersReducedMotion = useReducedMotion();

  if (!WHATSAPP_NUMBER) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(STARTER_MESSAGE)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Chat with us on WhatsApp"
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
    >
      <span className="whatsapp-fab__pulse" aria-hidden="true" />
      <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.393.7 4.623 1.91 6.497L4 29l7.69-1.87A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.7a9.66 9.66 0 0 1-4.93-1.35l-.353-.21-4.566 1.11 1.22-4.45-.23-.365A9.64 9.64 0 0 1 5.7 15c0-5.69 4.62-10.3 10.304-10.3S26.3 9.31 26.3 15s-4.612 9.7-10.296 9.7Zm5.34-7.26c-.293-.147-1.732-.855-2-.953-.268-.098-.463-.147-.658.147-.195.293-.756.953-.927 1.148-.171.196-.342.22-.635.073-.293-.147-1.238-.456-2.358-1.454-.872-.777-1.46-1.737-1.631-2.03-.171-.293-.018-.451.128-.598.132-.131.293-.342.44-.513.146-.171.195-.293.293-.489.098-.196.049-.367-.024-.514-.073-.147-.658-1.588-.902-2.174-.238-.571-.48-.494-.658-.503l-.561-.01c-.196 0-.514.073-.783.367-.268.293-1.025 1.002-1.025 2.443 0 1.44 1.05 2.833 1.196 3.028.146.196 2.066 3.157 5.007 4.428.699.302 1.245.482 1.67.617.702.224 1.34.192 1.845.117.563-.084 1.732-.708 1.977-1.392.244-.684.244-1.27.171-1.392-.073-.122-.268-.196-.561-.343Z" />
      </svg>
    </motion.a>
  );
}
