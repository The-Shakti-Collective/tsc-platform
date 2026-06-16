import '../../css/main.css';
import { initSite } from '../site.js';
import { createStepForm, showSuccess, getQueryParam } from './multi-step.js';

initSite();

const root = document.getElementById('form-root');
if (!root) throw new Error('form-root missing');

const courses = [
  { id: 'composition', title: 'The heART of Composition', mentor: 'Sandesh Shandilya' },
  { id: 'hindustani', title: 'Roots of Hindustani Classical', mentor: 'Prasad Khaparde' },
  { id: 'production', title: 'A–Z of Music Production', mentor: 'Luca Petracca' },
];

createStepForm(root, {
  prefill: {},
  steps: [
    {
      title: 'Your details',
      html: `<label class="block text-sm font-alan-sans mb-1">Full name<input name="name" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Email<input name="email" type="email" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Phone<input name="phone" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Country code<input name="countryCode" value="+91" class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>`,
      validate: (d) => (!d.name || !d.email || !d.phone ? 'Please fill all contact fields.' : null),
    },
    {
      title: 'Choose a course',
      html: `<div class="space-y-3">${courses.map((c) => `<label class="flex items-start gap-3 p-4 rounded-xl border border-black/10 cursor-pointer"><input type="radio" name="course" value="${c.id}" required class="mt-1" /><span><strong class="font-signika">${c.title}</strong><span class="block text-xs text-black/50 font-alan-sans">${c.mentor}</span></span></label>`).join('')}</div>`,
      validate: (d) => (!d.course ? 'Select a course.' : null),
    },
    {
      title: 'Schedule',
      html: `<label class="block text-sm font-alan-sans mb-1">Preferred date<input name="date" type="date" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>
<label class="block text-sm font-alan-sans mb-1">Preferred time<input name="time" type="time" required class="mt-1 w-full px-4 py-3 rounded-xl border border-black/10" /></label>`,
      validate: (d) => (!d.date || !d.time ? 'Pick date and time.' : null),
    },
    {
      title: 'Confirm',
      html: `<p class="font-alan-sans text-black/70 text-sm">We'll confirm your consultation slot by email or phone.</p>`,
    },
  ],
  onSubmit: async (data) => {
    const btn = root.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/book-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');
      showSuccess(root, json.message || 'Call booked successfully!');
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
