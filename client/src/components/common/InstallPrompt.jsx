import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'kaytech_pwa_install_dismissed_at';
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_COOLDOWN_MS;
}

// Custom "Install App" banner — the browser's native beforeinstallprompt UI
// is inconsistent (some browsers auto-show a mini-infobar, others show
// nothing at all), so this captures the event ourselves and shows one
// on-brand banner instead. Chrome/Edge/Android only — iOS Safari never
// fires beforeinstallprompt, there's no equivalent to show there.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Whether accepted or dismissed, the captured event is single-use.
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="install-prompt" role="dialog" aria-label="Install KayTech Hub">
      <span className="install-prompt__icon">
        <Download size={18} aria-hidden="true" />
      </span>
      <div className="install-prompt__text">
        <strong>Install KayTech Hub</strong>
        <p>Add it to your home screen for quick, full-screen access.</p>
      </div>
      <div className="install-prompt__actions">
        <button type="button" className="btn btn--primary" onClick={handleInstall}>Install</button>
        <button type="button" className="install-prompt__dismiss" onClick={handleDismiss} aria-label="Dismiss">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
