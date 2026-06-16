import '../css/main.css';
import navData from '../data/navigation.json';
import constants from '../data/constants.json';
import { initMotion } from './motion.js';

const MAIN_NAV = navData.MAIN_NAV;
const FOOTER_SECTIONS = navData.FOOTER_SECTIONS;
const SOCIAL_LINKS = navData.SOCIAL_LINKS;

function isNavActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMainNavActive(pathname, item) {
  if (item.matchPrefixes) {
    return item.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
  return isNavActive(pathname, item.href);
}

function navLinkClass(item, pathname) {
  const active = isMainNavActive(pathname, item);
  const emphasis = item.emphasis;
  if (emphasis) {
    return active
      ? 'text-teal-dark font-bold'
      : 'text-teal-dark font-semibold hover:text-orange';
  }
  return active
    ? 'text-orange font-semibold'
    : 'text-teal-mid hover:text-orange';
}

function renderDesktopNav(container, pathname) {
  container.innerHTML = '';
  const dropdowns = [];

  for (const item of MAIN_NAV) {
    if (item.children) {
      const wrap = document.createElement('div');
      wrap.className = 'relative nav-dropdown';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cursor-pointer inline-flex items-center gap-1 whitespace-nowrap font-alan-sans text-sm md:text-[15px] transition-colors duration-200 ${navLinkClass(item, pathname)}`;
      btn.innerHTML = `${item.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
      const panel = document.createElement('div');
      panel.className =
        'nav-dropdown-panel absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-xl border border-teal-dark/10 bg-cream shadow-[0_12px_40px_-12px_rgba(8,61,58,0.15)] py-2 z-50';
      for (const child of item.children) {
        const a = document.createElement('a');
        a.href = child.href;
        a.className = `block px-4 py-2.5 hover:bg-teal-dark/5 ${isNavActive(pathname, child.href) ? 'bg-orange/10' : ''}`;
        a.innerHTML = `<span class="block text-sm font-semibold font-alan-sans text-teal-dark">${child.label}</span>${child.description ? `<span class="block text-[11px] text-amber-text/70 font-alan-sans mt-0.5 leading-snug">${child.description}</span>` : ''}`;
        panel.appendChild(a);
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdowns.forEach((d) => {
          if (d !== wrap) d.classList.remove('is-open');
        });
        wrap.classList.toggle('is-open');
      });
      dropdowns.push(wrap);
      wrap.append(btn, panel);
      container.appendChild(wrap);
    } else {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = `cursor-pointer whitespace-nowrap font-alan-sans text-sm md:text-[15px] transition-colors duration-200 ${navLinkClass(item, pathname)}`;
      a.textContent = item.label;
      container.appendChild(a);
    }
  }

  document.addEventListener('click', () => {
    dropdowns.forEach((d) => d.classList.remove('is-open'));
  });

  const insights = document.createElement('a');
  insights.href = '/insights';
  insights.className =
    'px-4 py-2 rounded-full bg-orange text-white font-semibold font-alan-sans text-sm hover:bg-orange/90 transition-colors';
  insights.textContent = 'Insights';
  container.appendChild(insights);
}

function renderMobileNav(container, pathname) {
  container.innerHTML = '';
  for (const item of MAIN_NAV) {
    if (item.children) {
      const block = document.createElement('div');
      block.className = 'border-b border-teal-dark/10 pb-2 mb-2';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = `w-full flex items-center justify-between py-3 cursor-pointer font-alan-sans text-base ${item.emphasis ? 'text-teal-dark font-semibold' : 'text-teal-mid font-medium'}`;
      toggle.textContent = item.label;
      const sub = document.createElement('div');
      sub.className = 'hidden pl-3 pb-2 space-y-1 mobile-subnav';
      for (const child of item.children) {
        const a = document.createElement('a');
        a.href = child.href;
        a.className = `block py-2.5 text-sm font-alan-sans cursor-pointer ${isNavActive(pathname, child.href) ? 'text-orange font-semibold' : 'text-amber-text'}`;
        a.textContent = child.label;
        sub.appendChild(a);
      }
      toggle.addEventListener('click', () => sub.classList.toggle('hidden'));
      block.append(toggle, sub);
      container.appendChild(block);
    } else {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = `py-3 border-b border-teal-dark/10 font-alan-sans text-base cursor-pointer block ${navLinkClass(item, pathname)}`;
      a.textContent = item.label;
      container.appendChild(a);
    }
  }
  const wa = document.createElement('a');
  wa.href = constants.WHATSAPP_COMMUNITY_URL;
  wa.target = '_blank';
  wa.rel = 'noopener noreferrer';
  wa.className = 'py-3 text-orange font-alan-sans text-base';
  wa.textContent = 'Join WA Community';
  container.appendChild(wa);
}

function setMobileNavOpen(open) {
  const toggle = document.getElementById('mobile-nav-toggle');
  const panel = document.getElementById('mobile-nav-panel');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  panel?.classList.toggle('hidden', !open);
  backdrop?.classList.toggle('hidden', !open);
  toggle?.setAttribute('aria-expanded', String(open));
  toggle?.querySelector('.icon-menu')?.classList.toggle('hidden', open);
  toggle?.querySelector('.icon-close')?.classList.toggle('hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function initLayout() {
  const layout = document.body.dataset.layout || 'marketing';
  const marketingHeader = document.getElementById('site-header');
  const academyHeader = document.getElementById('academy-header');
  if (layout === 'academy' || layout === 'course') {
    marketingHeader?.classList.add('hidden');
    academyHeader?.classList.remove('hidden');
    document.body.classList.add('pt-16');
  } else if (layout === 'review') {
    marketingHeader?.classList.add('hidden');
  } else {
    academyHeader?.classList.add('hidden');
    document.body.classList.add('pt-20');
  }
  if (layout === 'form' && document.body.dataset.formSuccess !== 'true') {
    document.getElementById('site-footer')?.classList.add('hidden');
  }
}

function initNav() {
  const pathname = window.location.pathname.replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/';
  const desktop = document.getElementById('desktop-nav');
  const mobileLinks = document.getElementById('mobile-nav-links');
  if (desktop) renderDesktopNav(desktop, pathname);
  if (mobileLinks) renderMobileNav(mobileLinks, pathname);

  const toggle = document.getElementById('mobile-nav-toggle');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  toggle?.addEventListener('click', () => {
    const panel = document.getElementById('mobile-nav-panel');
    const isOpen = panel?.classList.contains('hidden') !== false;
    setMobileNavOpen(isOpen);
  });
  backdrop?.addEventListener('click', () => setMobileNavOpen(false));
  mobileLinks?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setMobileNavOpen(false));
  });
}

function initFooter() {
  const year = document.getElementById('footer-year');
  if (year) year.textContent = String(new Date().getFullYear());

  const sectionsEl = document.getElementById('footer-sections');
  if (sectionsEl) {
    sectionsEl.innerHTML = FOOTER_SECTIONS.map(
      (section) => `
      <div>
        <h3 class="text-xs font-black uppercase tracking-widest text-orange mb-4 font-alan-sans">${section.title}</h3>
        <ul class="space-y-2.5">
          ${section.links
            .map(
              (link) =>
                `<li><a href="${link.href}" ${link.external ? 'target="_blank" rel="noopener noreferrer"' : ''} class="text-sm text-cream/60 hover:text-orange transition-colors font-alan-sans">${link.label}</a></li>`,
            )
            .join('')}
        </ul>
      </div>`,
    ).join('');
  }

  const social = document.getElementById('footer-social');
  if (social) {
    const links = [
      ['Instagram', SOCIAL_LINKS.instagram],
      ['LinkedIn', SOCIAL_LINKS.linkedin],
      ['YouTube', SOCIAL_LINKS.youtube],
    ];
    social.innerHTML = links
      .map(
        ([label, href]) =>
          `<a href="${href}" target="_blank" rel="noopener noreferrer" class="hover:text-orange transition-colors">${label}</a>`,
      )
      .join('');
  }

  const form = document.getElementById('newsletter-form');
  const message = document.getElementById('newsletter-message');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const btn = form.querySelector('button');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (message) {
        message.classList.remove('hidden');
        message.textContent = data.success ? 'Welcome to the collective!' : data.error || 'Failed to subscribe.';
      }
      if (data.success) form.reset();
    } catch {
      if (message) {
        message.classList.remove('hidden');
        message.textContent = 'A network error occurred.';
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

let posthogInitialized = false;

function isValidPosthogKey(key) {
  if (!key?.trim()) return false;
  if (/REPLACE_ME|placeholder|xxx/i.test(key)) return false;
  return key.startsWith('phc_');
}

function resolvePosthogHost() {
  const configured = import.meta.env.VITE_POSTHOG_HOST?.trim();
  if (!configured) return 'https://us.i.posthog.com';
  try {
    const url = new URL(configured);
    // Ingest host must be *.i.posthog.com — UI host breaks SDK script loads.
    if (!/\.i\.posthog\.com$/i.test(url.hostname)) return 'https://us.i.posthog.com';
    return url.origin;
  } catch {
    return 'https://us.i.posthog.com';
  }
}

function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (isValidPosthogKey(key) && !posthogInitialized && typeof window !== 'undefined') {
    import('posthog-js')
      .then(({ default: posthog }) => {
        if (posthogInitialized) return;
        posthog.init(key, {
          api_host: resolvePosthogHost(),
          capture_pageview: true,
          capture_pageleave: true,
          person_profiles: 'identified_only',
        });
        posthogInitialized = true;
      })
      .catch(() => {});
  }
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    import('@sentry/browser').then((Sentry) => {
      Sentry.init({ dsn, environment: import.meta.env.MODE });
    });
  }
}

export function initSite() {
  initLayout();
  initNav();
  initFooter();
  initMotion();
  initAnalytics();
}
