const REDUCED_MOTION = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion() {
  if (REDUCED_MOTION()) {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger] > *').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return;
  }

  initScrollReveal();
  initParallax();
  initBlurUp();
}

function initScrollReveal() {
  const singles = document.querySelectorAll('[data-reveal]');
  const staggers = document.querySelectorAll('[data-reveal-stagger]');

  if (!singles.length && !staggers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target;
        if (target.hasAttribute('data-reveal-stagger')) {
          const children = target.children;
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.style.setProperty('--reveal-delay', `${i * 80}ms`);
            child.classList.add('is-revealed');
          }
        } else {
          target.classList.add('is-revealed');
        }
        observer.unobserve(target);
      }
    },
    { rootMargin: '-8% 0px -8% 0px', threshold: 0.12 },
  );

  singles.forEach((el) => observer.observe(el));
  staggers.forEach((el) => observer.observe(el));
}

function initParallax() {
  const layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    layers.forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-parallax') || '1.2');
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (vh - rect.top) / (vh + rect.height);
      const offset = (progress - 0.5) * 40 * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

function initBlurUp() {
  document.querySelectorAll('img[data-blur-up]').forEach((img) => {
    const done = () => img.setAttribute('data-load-done', 'true');
    if (img.complete) done();
    else img.addEventListener('load', done, { once: true });
  });
}
