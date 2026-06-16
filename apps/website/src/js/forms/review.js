import '../../css/main.css';

const root = document.getElementById('review-root');
const kind = root?.dataset.review || 'review01';
const apiPath = kind === 'review02' ? '/api/reviews02' : '/api/reviews';

root.innerHTML = `<form id="review-form" class="space-y-4"><h1 class="text-2xl font-signika font-bold mb-6">Share your experience</h1>
<label class="block text-sm">First name<input name="firstName" required class="mt-1 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20" /></label>
<label class="block text-sm">Last name<input name="lastName" required class="mt-1 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20" /></label>
<label class="block text-sm">Mobile<input name="registeredMobile" required class="mt-1 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20" /></label>
<label class="block text-sm">Email<input name="registeredEmail" type="email" required class="mt-1 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20" /></label>
<label class="block text-sm">Experience in one line<textarea name="oneLineExperience" required rows="2" class="mt-1 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20"></textarea></label>
<label class="block text-sm">Suggestions<textarea name="improvementSuggestion" required rows="3" class="mt-1 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20"></textarea></label>
<p id="review-error" class="text-sm text-red-400 hidden"></p>
<button type="submit" class="w-full py-3 rounded-full bg-orange font-bold">Submit Review</button></form>`;

document.getElementById('review-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  const errEl = document.getElementById('review-error');
  try {
    const res = await fetch(apiPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed');
    root.innerHTML = `<div class="text-center py-16"><h2 class="text-2xl font-signika font-bold mb-3">Thank you</h2><p class="text-white/60">Review submitted.</p></div>`;
  } catch (err) {
    if (errEl) {
      errEl.textContent = err instanceof Error ? err.message : 'Failed';
      errEl.classList.remove('hidden');
    }
  }
});
