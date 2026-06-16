import { initSite } from '../site.js';
import { initFaq } from '../components.js';

initSite();
initFaq();

const form = document.getElementById('contact-form');
const message = document.getElementById('contact-message');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (message) {
      message.classList.remove('hidden');
      message.textContent = data.success ? 'Message sent. We will be in touch.' : data.error || 'Failed to send.';
      message.classList.toggle('text-orange', !!data.success);
    }
    if (data.success) form.reset();
  } catch {
    if (message) {
      message.classList.remove('hidden');
      message.textContent = 'Network error. Please try again.';
    }
  }
});
