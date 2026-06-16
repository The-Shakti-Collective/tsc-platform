/** Shared HTML builders for TSC editorial layout (generate-pages.mjs). */

export function sectionDivider(fill = 'cream') {
  const fills = {
    cream: '#FFECD1',
    white: '#FFFFFF',
    teal: '#083D3A',
  };
  const color = fills[fill] || fills.cream;
  return `<div class="section-divider w-full leading-[0]" aria-hidden="true">
<svg class="w-full h-12 sm:h-16 md:h-20" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="${color}" d="M0,48 C240,96 480,0 720,48 C960,96 1200,16 1440,48 L1440,80 L0,80 Z"/>
  <path fill="${color}" opacity="0.85" d="M0,56 C180,24 360,72 540,40 C720,8 900,64 1080,36 C1260,8 1380,52 1440,44 L1440,80 L0,80 Z"/>
</svg></div>`;
}

export function textureOverlay() {
  return `<div class="texture-overlay pointer-events-none" aria-hidden="true"></div>`;
}

export function sectionShell({
  content,
  className = '',
  bg = 'bg-cream',
  divider = false,
  dividerFill = 'cream',
  texture = false,
  reveal = false,
  id = '',
}) {
  const idAttr = id ? ` id="${id}"` : '';
  const revealAttr = reveal ? ' data-reveal' : '';
  return `<section${idAttr} class="relative ${bg} ${className}"${revealAttr}>
${texture ? textureOverlay() : ''}
<div class="relative z-10">${content}</div>
${divider ? sectionDivider(dividerFill) : ''}
</section>`;
}

export function tagPill(label) {
  return `<span class="inline-flex px-4 py-2 rounded-full border border-teal-dark/20 text-teal-dark font-alan-sans text-sm hover:border-orange/40 hover:text-orange transition-colors">${label}</span>`;
}

export function editorialHero(eyebrow, title, subtitle, { wash = true, divider = true } = {}) {
  return `<section class="relative min-h-[70svh] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 overflow-hidden bg-cream">
${textureOverlay()}
${wash ? '<div class="absolute inset-0 bg-orange-wash pointer-events-none" aria-hidden="true"></div>' : ''}
<div class="relative z-10 max-w-4xl mx-auto text-center" data-reveal>
<p class="text-[10px] font-black uppercase tracking-[0.35em] text-orange font-alan-sans mb-4">${eyebrow}</p>
<h1 class="text-[clamp(2.25rem,5vw+1rem,3.75rem)] font-bold font-signika text-teal-dark mb-4 leading-tight">${title}</h1>
<p class="text-lg text-amber-text font-alan-sans max-w-2xl mx-auto">${subtitle}</p>
</div>
${divider ? sectionDivider('cream') : ''}
</section>`;
}

export function pageHero(eyebrow, title, subtitle) {
  return editorialHero(eyebrow, title, subtitle);
}

export function bookCallCta(title, desc) {
  return sectionShell({
    bg: 'bg-cream',
    className: 'px-4 sm:px-6 pb-20 pt-4',
    content: `<div class="max-w-4xl mx-auto rounded-3xl bg-teal-dark text-cream p-8 sm:p-10 text-center" data-reveal>
<h2 class="text-2xl sm:text-3xl font-bold font-signika mb-3">${title}</h2>
<p class="text-cream/70 font-alan-sans text-sm sm:text-base mb-6">${desc}</p>
<a href="/book-a-call" class="inline-flex px-6 py-3 rounded-full bg-orange text-white font-bold font-alan-sans text-sm hover:bg-orange/90 transition-colors">Book a Call</a>
</div>`,
  });
}

export function connectStrip(links, { title = 'Connect', subtitle = 'Digital Presence' } = {}) {
  const pills = links
    .map(
      (l) =>
        `<a href="${l.href}" ${l.external !== false ? 'target="_blank" rel="noopener noreferrer"' : ''} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-teal-dark/25 text-teal-dark font-alan-sans text-sm hover:border-orange hover:text-orange transition-colors">${l.label}</a>`,
    )
    .join('');
  return sectionShell({
    bg: 'bg-cream-light',
    className: 'py-16 px-4 sm:px-6',
    divider: true,
    reveal: true,
    content: `<div class="max-w-4xl mx-auto text-center">
<p class="text-xs uppercase tracking-[0.25em] text-amber-text font-alan-sans mb-2">${title}</p>
<h2 class="font-signika font-bold text-2xl text-teal-dark mb-8">${subtitle}</h2>
<div class="flex flex-wrap justify-center gap-3">${pills}</div>
</div>`,
  });
}

export function storyIpCard(ip, index) {
  const size = index === 0 ? 'col-span-2 row-span-2' : '';
  const inner = `<img src="${ip.image}" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" loading="lazy" data-blur-up />
<div class="absolute inset-0 bg-gradient-to-t from-teal-dark/85 via-teal-dark/20 to-transparent pointer-events-none"></div>
<div class="absolute bottom-0 left-0 right-0 p-4 text-cream pointer-events-none"><span class="text-[10px] uppercase tracking-widest text-orange-light font-alan-sans">${ip.tag}</span><h3 class="font-signika font-bold">${ip.title}</h3><p class="text-xs text-cream/70 font-alan-sans">${ip.desc || ''}</p></div>`;
  if (ip.href) {
    const ext = ip.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${ip.href}"${ext} class="${size} relative rounded-2xl overflow-hidden aspect-square block group">${inner}</a>`;
  }
  return `<article class="${size} relative rounded-2xl overflow-hidden aspect-square">${inner}</article>`;
}

export function initiativeCard(item, index) {
  const size = index === 0 ? 'col-span-2 row-span-2' : '';
  const inner = `<img src="${item.image}" alt="" class="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" />
<div class="absolute inset-0 bg-gradient-to-t from-teal-dark/80 to-transparent pointer-events-none"></div>
<div class="absolute bottom-0 p-4 text-cream pointer-events-none"><p class="text-[10px] uppercase tracking-widest text-orange-light font-alan-sans">${item.vertical}</p><h3 class="font-signika font-bold text-lg">${item.title}</h3></div>`;
  if (item.href) {
    const ext = item.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${item.href}"${ext} class="${size} relative rounded-2xl overflow-hidden aspect-square block group">${inner}</a>`;
  }
  return `<article class="${size} relative rounded-2xl overflow-hidden aspect-square">${inner}</article>`;
}

export function mediaGridCard(item) {
  const platformIcon =
    item.platform === 'youtube'
      ? '▶'
      : item.platform === 'spotify'
        ? '♫'
        : '↗';
  return `<a href="${item.href}" target="_blank" rel="noopener noreferrer" class="group block rounded-2xl overflow-hidden border border-teal-dark/10 bg-white hover:border-orange/30 transition-colors">
<div class="relative aspect-video overflow-hidden">${item.image ? `<img src="${item.image}" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" loading="lazy" data-blur-up />` : `<div class="absolute inset-0 bg-teal-dark/10"></div>`}
<span class="absolute top-3 right-3 w-8 h-8 rounded-full bg-cream/90 text-teal-dark flex items-center justify-center text-sm">${platformIcon}</span></div>
<div class="p-4"><h3 class="font-signika font-bold text-teal-dark">${item.title}</h3></div>
</a>`;
}

export function renderArtistPage(artist) {
  const tags = (artist.tags || []).map(tagPill).join('');
  const highlights = artist.highlights.map((h) => `<li class="text-amber-text font-alan-sans">${h}</li>`).join('');
  const media = (artist.media || []).map(mediaGridCard).join('');
  const social = artist.social || [];
  const portrait = artist.portrait || artist.image;

  return `${sectionShell({
    bg: 'bg-cream',
    texture: true,
    className: 'min-h-[75svh] flex items-center justify-center pt-28 pb-8 px-4 overflow-hidden',
    divider: true,
    content: `<div class="absolute inset-0 bg-orange-wash pointer-events-none" aria-hidden="true"></div>
<div class="relative z-10 text-center max-w-3xl mx-auto" data-reveal>
<p class="text-[10px] font-black uppercase tracking-[0.35em] text-orange font-alan-sans mb-4">${artist.role}</p>
<h1 class="text-[clamp(2.5rem,6vw,4rem)] font-signika font-bold text-teal-dark mb-4">${artist.name}</h1>
<p class="text-lg text-amber-text font-alan-sans mb-8">${artist.tagline}</p>
<a href="/query?artist=${encodeURIComponent(artist.queryArtist)}" class="inline-flex px-8 py-3 rounded-full bg-orange text-white font-bold font-alan-sans hover:bg-orange/90 transition-colors">Inquire Online</a>
</div>`,
  })}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-16 px-4 sm:px-6',
  divider: true,
  reveal: true,
  content: `<div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
<div class="relative overflow-hidden rounded-3xl aspect-[3/4] max-h-[520px] mx-auto w-full max-w-md">
<img src="${portrait}" alt="${artist.name}" class="w-full h-full object-cover blur-up" data-parallax="1.5" data-blur-up loading="lazy" />
</div>
<div>
${artist.bio ? `<p class="font-alan-sans text-amber-text leading-relaxed mb-6">${artist.bio}</p>` : ''}
${tags ? `<div class="flex flex-wrap gap-2 mb-6">${tags}</div>` : ''}
<ul class="space-y-2 mb-8 text-sm">${highlights}</ul>
<a href="/artists" class="text-orange font-semibold font-alan-sans">← Back to roster</a>
</div>
</div>`,
})}
${media ? sectionShell({
  bg: 'bg-cream',
  className: 'py-16 px-4 sm:px-6',
  divider: true,
  content: `<div class="max-w-6xl mx-auto"><h2 class="font-signika font-bold text-2xl text-teal-dark text-center mb-10" data-reveal>Listen & Watch</h2><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-reveal-stagger>${media}</div></div>`,
}) : ''}
${social.length ? connectStrip(social) : ''}
${sectionShell({
  bg: 'bg-teal-dark',
  className: 'relative py-24 px-4 overflow-hidden',
  content: `<img src="${artist.image}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" loading="lazy" />
<div class="absolute inset-0 bg-teal-dark/70 pointer-events-none"></div>
<div class="relative z-10 max-w-2xl mx-auto text-center text-cream" data-reveal>
<h2 class="font-signika font-bold text-2xl mb-4">Book ${artist.name.split(' ')[0]}</h2>
<p class="font-alan-sans text-cream/80 mb-6">Live performances, studio sessions, and brand collaborations.</p>
<a href="/query?artist=${encodeURIComponent(artist.queryArtist)}" class="inline-flex px-8 py-3 rounded-full bg-orange text-white font-bold">Get in Touch</a>
</div>`,
})}`;
}
