/** Shared multi-step form utilities */
export function createStepForm(root, { steps, onSubmit, prefill = {} }) {
  let current = 0;
  const data = { ...prefill };

  function render() {
    root.innerHTML = `
      <div class="mb-6 flex items-center justify-between gap-4">
        <button type="button" id="form-back" class="text-sm text-black/50 hover:text-black ${current === 0 ? 'invisible' : ''}">← Back</button>
        <div class="text-sm font-alan-sans"><span class="text-orange font-semibold">Step ${current + 1}</span> of ${steps.length} · ${steps[current].title}</div>
      </div>
      <form id="step-form" class="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-black/10 shadow-sm">
        ${steps[current].html}
        <p id="form-error" class="text-sm text-red-600 hidden"></p>
        <button type="submit" class="w-full py-3 rounded-full bg-orange text-white font-bold font-alan-sans hover:bg-orange/90">${current === steps.length - 1 ? 'Submit' : 'Continue'}</button>
      </form>`;

    const form = root.querySelector('#step-form');
    const back = root.querySelector('#form-back');
    back?.addEventListener('click', () => {
      if (current > 0) {
        saveStep(form);
        current -= 1;
        render();
      }
    });
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveStep(form);
      const err = steps[current].validate?.(data);
      const errEl = root.querySelector('#form-error');
      if (err) {
        errEl.textContent = err;
        errEl.classList.remove('hidden');
        return;
      }
      errEl?.classList.add('hidden');
      if (current < steps.length - 1) {
        current += 1;
        render();
      } else {
        onSubmit(data, root);
      }
    });

    for (const [key, val] of Object.entries(data)) {
      const input = form?.querySelector(`[name="${key}"]`);
      if (input && val) input.value = val;
    }
  }

  function saveStep(form) {
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) data[k] = String(v);
  }

  render();
  return { getData: () => data };
}

export function showSuccess(root, message) {
  document.body.dataset.formSuccess = 'true';
  document.getElementById('site-footer')?.classList.remove('hidden');
  root.innerHTML = `<div class="text-center py-16"><div class="w-16 h-16 rounded-full bg-orange/10 text-orange flex items-center justify-center mx-auto mb-6 text-2xl">✓</div><h2 class="text-2xl font-signika font-bold mb-3">Thank you</h2><p class="font-alan-sans text-black/60">${message}</p></div>`;
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}
