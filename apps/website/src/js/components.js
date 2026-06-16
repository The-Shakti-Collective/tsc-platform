export function initFaq(root = document) {
  root.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-trigger');
    btn?.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      root.querySelectorAll('.faq-item.is-open').forEach((el) => el.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });
}

export function initToolFilter(root = document) {
  const buttons = root.querySelectorAll('[data-tool-filter]');
  const cards = root.querySelectorAll('[data-tool-category]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-tool-filter') || 'All';
      buttons.forEach((b) => b.classList.toggle('bg-orange', b === btn));
      buttons.forEach((b) => b.classList.toggle('text-white', b === btn));
      buttons.forEach((b) => b.classList.toggle('bg-black/5', b !== btn));
      cards.forEach((card) => {
        const cat = card.getAttribute('data-tool-category');
        card.classList.toggle('hidden-by-filter', filter !== 'All' && cat !== filter);
      });
    });
  });
}
