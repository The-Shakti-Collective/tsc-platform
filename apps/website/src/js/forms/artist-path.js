import '../../css/main.css';
import { initSite } from '../site.js';
import { createStepForm, showSuccess } from './multi-step.js';

initSite();

const root = document.getElementById('form-root');
if (!root) throw new Error('form-root missing');

createStepForm(root, {
  steps: [
    {
      title: 'Identity',
      html: `<div class="grid sm:grid-cols-2 gap-3"><label class="block text-sm font-alan-sans">First name<input name="firstName" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans">Last name<input name="lastName" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label></div>
<label class="block text-sm font-alan-sans mt-3">Stage name<input name="stageName" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mt-3">City<input name="place" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>`,
      validate: (d) => (!d.firstName || !d.lastName ? 'First and last name required.' : null),
    },
    {
      title: 'Contact & links',
      html: `<label class="block text-sm font-alan-sans mb-1">Email<input name="email" type="email" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Mobile<input name="mobile" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Instagram<input name="instagram" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Spotify<input name="spotify" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">YouTube<input name="youtube" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>`,
      validate: (d) => (!d.email || !d.mobile ? 'Email and mobile required.' : null),
    },
    {
      title: 'Artist journey',
      html: `<label class="block text-sm font-alan-sans mb-1">Artist identity<textarea name="artistIdentity" rows="2" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>
<label class="block text-sm font-alan-sans mb-1">Training details<textarea name="trainingDetails" rows="2" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>
<label class="block text-sm font-alan-sans mb-1">Core skills<textarea name="coreSkills" rows="2" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>`,
    },
    {
      title: 'Goals',
      html: `<label class="block text-sm font-alan-sans mb-1">Aspirational goal<textarea name="aspirationalGoal" rows="3" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>
<label class="block text-sm font-alan-sans mb-1">Mentorship needs<textarea name="mentorshipNeeds" rows="2" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>
<label class="block text-sm font-alan-sans mb-1">Anything else<textarea name="anythingElse" rows="2" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10"></textarea></label>`,
    },
    {
      title: 'Submit',
      html: `<p class="text-sm font-alan-sans text-black/60">By submitting you agree to be contacted about Artist Path opportunities.</p>`,
    },
  ],
  onSubmit: async (data) => {
    const btn = root.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/artist-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');
      showSuccess(root, json.message || 'Application submitted successfully.');
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
