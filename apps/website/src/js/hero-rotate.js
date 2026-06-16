import siteContent from '../data/siteContent.json';

const suffixes = siteContent.HERO_HEADLINE_SUFFIXES;
const prefix = siteContent.HERO_HEADLINE_PREFIX;

export function initHeroRotate() {
  const suffixEl = document.getElementById('hero-suffix');
  const dots = document.querySelectorAll('[data-hero-dot]');
  if (!suffixEl || !suffixes.length) return;

  let index = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i) {
    index = i;
    suffixEl.textContent = suffixes[index];
    dots.forEach((dot, di) => {
      dot.classList.toggle('bg-orange', di === index);
      dot.classList.toggle('bg-teal-dark/20', di !== index);
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => show(i));
  });

  if (reducedMotion) {
    show(0);
    return;
  }

  show(0);
  window.setInterval(() => {
    suffixEl.classList.add('is-exiting');
    window.setTimeout(() => {
      show((index + 1) % suffixes.length);
      suffixEl.classList.remove('is-exiting');
      suffixEl.classList.add('is-entering');
      requestAnimationFrame(() => suffixEl.classList.remove('is-entering'));
    }, 200);
  }, 3200);
}

export function renderHeroCtas(container) {
  if (!container) return;
  container.innerHTML = siteContent.HERO_CTAS.map(
    (cta) =>
      `<a href="${cta.href}" class="group flex flex-col items-start p-5 sm:p-6 rounded-2xl border border-teal-dark/10 bg-white hover:border-orange/40 hover:shadow-lg transition-all duration-300"><span class="text-[10px] font-black uppercase tracking-widest text-orange/80 font-alan-sans mb-2">I want to</span><span class="text-base sm:text-lg font-bold font-signika text-teal-dark group-hover:text-orange transition-colors">${cta.label}</span></a>`,
  ).join('');
}

export { prefix as HERO_PREFIX, suffixes as HERO_SUFFIXES };
