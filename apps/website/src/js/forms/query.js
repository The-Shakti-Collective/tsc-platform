import '../../css/main.css';
import { initSite } from '../site.js';
import { createStepForm, showSuccess, getQueryParam } from './multi-step.js';

initSite();

const root = document.getElementById('form-root');
if (!root) throw new Error('form-root missing');

const artistPrefill = getQueryParam('artist');

createStepForm(root, {
  prefill: { artist: artistPrefill },
  steps: [
    {
      title: 'Contact',
      html: `<label class="block text-sm font-alan-sans mb-1">Name<input name="name" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Company / Organization<input name="company" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Email<input name="email" type="email" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Phone<input name="phone" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>`,
      validate: (d) => (!d.name || !d.email ? 'Name and email required.' : null),
    },
    {
      title: 'Engagement',
      html: `<label class="block text-sm font-alan-sans mb-1">Artist (if booking)<input name="artist" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" placeholder="Artist name" /></label>
<label class="block text-sm font-alan-sans mb-1">Collaboration type<input name="collabType" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Nature of engagement<textarea name="nature" rows="3" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>`,
    },
    {
      title: 'Details',
      html: `<label class="block text-sm font-alan-sans mb-1">When & where<input name="locationTime" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Scale / reach<input name="scale" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Logistics support<textarea name="logisticsSupport" rows="2" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>
<label class="block text-sm font-alan-sans mb-1">Additional vision<textarea name="additionalVision" rows="3" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>`,
    },
  ],
  onSubmit: async (data) => {
    const btn = root.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');
      showSuccess(root, 'Inquiry received. Our team will respond shortly.');
    } catch (e) {
      const errEl = root.querySelector('#form-error');
      if (errEl) {
        errEl.textContent = e instanceof Error ? e.message : 'Submission failed';
        errEl.classList.remove('hidden');
      }
      if (btn) btn.disabled = false;
    }
  },
});
