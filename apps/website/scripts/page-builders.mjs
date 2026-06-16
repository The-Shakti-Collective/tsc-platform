/**
 * TSC Design Language v1.0 — page blueprints (Hero → Narrative → Proof → Connection → Conversion).
 * @see docs/design-language-v1.md
 */
import {
  BODY,
  BODY_SM,
  CARD,
  CONVERSION_PAD,
  EYEBROW,
  EYEBROW_CONNECT,
  H2,
  H2_SECTION,
  PRIMARY_CTA,
  SECONDARY_CTA,
  SECTION_PAD,
  SECTION_PAD_COMPACT,
  WIDTH,
} from './design-tokens.mjs';
import {
  bookCallCta,
  connectStrip,
  editorialHero,
  initiativeCard,
  sectionDivider,
  sectionShell,
  storyIpCard,
  tagPill,
  textureOverlay,
} from './layout-helpers.mjs';

/** First section after hero is always cream-light; then alternates. */
function bandBg(index) {
  return index % 2 === 0 ? 'bg-cream-light' : 'bg-cream';
}

function bandNext(index) {
  return index % 2 === 0 ? 'cream' : 'cream-light';
}

/** Standard marketing hero — editorial, no full-bleed photo. */
export function marketingHero(eyebrow, title, subtitle) {
  return editorialHero(eyebrow, title, subtitle, { nextBg: 'cream-light' });
}

/**
 * Rhythmic content band (Narrative / Proof / Connection primitives).
 * @param {number} index — 0 = first band after hero (cream-light)
 */
export function contentBand(index, content, opts = {}) {
  const { id = '', divider = true, texture = false, nextBgOverride } = opts;
  return sectionShell({
    id,
    bg: bandBg(index),
    className: SECTION_PAD,
    divider,
    nextBg: nextBgOverride || bandNext(index),
    texture,
    reveal: true,
    content,
  });
}

/** Centered narrative block — copy-first, no random widgets. */
export function narrativeCenter(eyebrow, headline, bodyHtml, width = WIDTH.narrative) {
  const eyebrowHtml = eyebrow ? `<p class="${EYEBROW} mb-4">${eyebrow}</p>` : '';
  return `<div class="${width} mx-auto text-center" data-reveal>
${eyebrowHtml}
<h2 class="${H2} mb-6">${headline}</h2>
<div class="${BODY} space-y-4">${bodyHtml}</div>
</div>`;
}

/** Section title for proof grids (cards, stats, work samples). */
export function proofHeader(eyebrow, headline, sub = '') {
  const subHtml = sub ? `<p class="${BODY_SM} text-center max-w-2xl mx-auto mb-10" data-reveal>${sub}</p>` : '';
  return `<p class="${EYEBROW} mb-2 text-center" data-reveal>${eyebrow}</p>
<h2 class="${H2_SECTION} text-center mb-4" data-reveal>${headline}</h2>
${subHtml}`;
}

/** Standard proof card — text evidence, not image hero. */
export function proofCard(title, body) {
  return `<article class="${CARD} p-6"><h3 class="font-signika font-bold text-lg text-teal-dark mb-3">${title}</h3><p class="text-sm ${BODY_SM.replace('text-base ', '')} leading-relaxed">${body}</p></article>`;
}

/** Compact stats strip — Proof primitive on teal (utility band). */
export function statsBand(items, { columns = 4 } = {}) {
  const cols = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';
  return sectionShell({
    bg: 'bg-teal-dark',
    className: SECTION_PAD_COMPACT,
    divider: true,
    nextBg: 'cream',
    content: `<div class="${WIDTH.grid} mx-auto grid ${cols} gap-4">${items
      .map(
        (s) =>
          `<p class="text-cream/80 font-alan-sans text-sm text-center">${typeof s === 'string' ? s : `<strong class="block text-cream font-signika text-lg mb-1">${s.value}</strong>${s.label}`}</p>`,
      )
      .join('')}</div>`,
  });
}

/** Teal conversion band — one primary CTA. */
export function conversionBand(title, desc, { href = '/book-a-call', label = 'Book a Call', tertiary } = {}) {
  const tertiaryHtml = tertiary
    ? `<p class="mt-4"><a href="${tertiary.href}" class="text-cream/60 hover:text-orange text-sm font-alan-sans">${tertiary.label}</a></p>`
    : '';
  return sectionShell({
    bg: 'bg-teal-dark',
    className: `${CONVERSION_PAD} text-center text-cream`,
    content: `<div class="${WIDTH.narrative} mx-auto" data-reveal>
<h2 class="${H2} text-cream mb-4">${title}</h2>
<p class="text-cream/70 font-alan-sans text-lg mb-8 max-w-lg mx-auto">${desc}</p>
<a href="${href}" class="${PRIMARY_CTA}">${label}</a>
${tertiaryHtml}
</div>`,
  });
}

/** Inline conversion card on cream — used before final bookCallCta. */
export function conversionCard(title, body, { href, label, email } = {}) {
  const action = email
    ? `<a href="mailto:${email}" class="${PRIMARY_CTA}">${label || 'Get in Touch'}</a>`
    : `<a href="${href || '/book-a-call'}" class="${PRIMARY_CTA}">${label || 'Book a Call'}</a>`;
  return `<div class="${WIDTH.editorial} mx-auto rounded-3xl bg-teal-dark text-cream p-8 sm:p-12 text-center" data-reveal>
<h2 class="${H2} text-cream mb-4">${title}</h2>
<p class="text-cream/70 font-alan-sans text-base sm:text-lg mb-8 max-w-lg mx-auto">${body}</p>
${action}
</div>`;
}

/** Roundway / model step — proof grid cell. */
export function roundwayStep(stage) {
  return `<div class="roundway-step ${CARD} p-5 text-center"><p class="${EYEBROW} mb-2">${stage.label}</p><h3 class="font-signika font-bold text-lg text-teal-dark mb-1">${stage.title}</h3><p class="text-amber-text/80 font-alan-sans text-xs">${stage.desc}</p></div>`;
}

/** Artist roster card — links to profile + book. */
export function rosterCard(artist) {
  return `<article class="${CARD} overflow-hidden">
<a href="${artist.href}"><img src="${artist.image}" alt="${artist.name}" class="w-full aspect-[4/3] object-cover" loading="lazy" data-blur-up /></a>
<div class="p-6">
<p class="${EYEBROW} mb-2">${artist.role}</p>
<h2 class="font-signika font-bold text-xl text-teal-dark mb-2"><a href="${artist.href}" class="hover:text-orange">${artist.name}</a></h2>
<p class="text-sm text-amber-text font-alan-sans mb-4">${artist.tagline}</p>
<ul class="text-xs text-amber-text/80 space-y-1 mb-4">${(artist.highlights || []).map((h) => `<li>• ${h}</li>`).join('')}</ul>
<div class="flex flex-wrap gap-2">
<a href="${artist.href}" class="${SECONDARY_CTA} !px-4 !py-2 text-sm">Profile</a>
<a href="/query?artist=${encodeURIComponent(artist.queryArtist)}" class="inline-flex px-4 py-2 rounded-full bg-orange text-white text-sm font-semibold font-alan-sans hover:bg-orange/90">Book</a>
</div>
</div>
</article>`;
}

/** Insight / resource card — narrative link, no image hero. */
export function resourceCard({ href, title, excerpt }) {
  return `<a href="${href}" class="block ${CARD} overflow-hidden hover:border-orange/40"><div class="p-6"><h3 class="font-signika font-bold text-teal-dark mb-2">${title}</h3><p class="text-sm text-amber-text font-alan-sans">${excerpt}</p></div></a>`;
}

/** Tool listing card — insights hub proof grid. */
export function toolCard(tool) {
  return `<a href="${tool.link}" target="_blank" rel="noopener" data-tool-category="${tool.category}" class="tool-card block ${CARD} p-5 hover:border-orange/40"><span class="${EYEBROW}">${tool.category}</span><h3 class="font-signika font-bold text-teal-dark mt-2 mb-2">${tool.name}</h3><p class="text-xs text-amber-text font-alan-sans">${tool.description}</p></a>`;
}

/** FAQ accordion — connection / support primitive. */
export function faqBlock(items) {
  return `<div class="space-y-3 mb-16">${items
    .map(
      (f, i) =>
        `<div class="faq-item border border-teal-dark/10 rounded-xl overflow-hidden bg-white ${i === 0 ? 'is-open' : ''}"><button type="button" class="faq-trigger w-full text-left px-6 py-5 flex items-center justify-between gap-4"><span class="text-base sm:text-lg font-bold font-signika text-teal-dark">${f.q}</span><span class="faq-icon flex-shrink-0 w-6 h-6 rounded-full border border-teal-dark/20 flex items-center justify-center transition-transform">+</span></button><div class="faq-panel"><div class="px-6 pb-6 text-amber-text font-alan-sans text-sm sm:text-base leading-relaxed border-t border-teal-dark/5 pt-4">${f.a}</div></div></div>`,
    )
    .join('')}</div>`;
}

/** Contact form — connection primitive. */
export function contactForm() {
  return `<form id="contact-form" class="space-y-4 bg-white p-6 rounded-2xl border border-teal-dark/10" data-reveal>
<h3 class="font-signika font-bold text-xl text-teal-dark mb-4">Get in touch</h3>
<input name="name" required placeholder="Name" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10 font-alan-sans" />
<input name="email" type="email" required placeholder="Email" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10 font-alan-sans" />
<input name="interest" placeholder="Interest (optional)" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10 font-alan-sans" />
<textarea name="message" required rows="4" placeholder="Message" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10 font-alan-sans"></textarea>
<button type="submit" class="${PRIMARY_CTA}">Send</button>
<p id="contact-message" class="text-sm hidden"></p>
</form>`;
}

/** Story / initiative image grid — proof with editorial cards (not hero photos). */
export function mediaProofGrid(items, renderFn, { columns = 'grid-cols-2 md:grid-cols-4' } = {}) {
  return `<div class="${WIDTH.grid} mx-auto grid ${columns} gap-3" data-reveal-stagger>${items.map(renderFn).join('')}</div>`;
}

/** Secondary nav pills — connection, not primary CTAs. */
export function secondaryPills(links) {
  return `<div class="flex flex-wrap justify-center gap-3 mt-10">${links
    .map(([label, href]) => `<a href="${href}" class="${SECONDARY_CTA} !px-5 !py-2.5 text-sm">${label}</a>`)
    .join('')}</div>`;
}

/** Compose standard marketing page ending: optional inline card + book call. */
export function pageFooter(conversionTitle, conversionDesc) {
  return bookCallCta(conversionTitle, conversionDesc);
}

// ─── Academy sub-brand (blue hero only; same spacing + cards) ───

export function academyHero(headline, subheadline, { actions = [] } = {}) {
  const actionHtml = actions
    .map((a, i) =>
      i === 0
        ? `<a href="${a.href}" class="${PRIMARY_CTA}">${a.label}</a>`
        : `<a href="${a.href}" class="${SECONDARY_CTA} border-white/30 text-white hover:border-orange hover:text-orange">${a.label}</a>`,
    )
    .join('');
  return `<section id="hero" class="relative pt-28 pb-16 px-4 sm:px-6 bg-academy-blue text-white">
<div class="${WIDTH.editorial} mx-auto text-center">
<p class="text-orange-light ${EYEBROW} mb-4">TSC Academy</p>
<h1 class="text-[clamp(2.5rem,6vw,4rem)] font-signika font-bold mb-4">${headline}</h1>
<p class="text-white/70 font-alan-sans text-lg mb-8 max-w-2xl mx-auto">${subheadline}</p>
<div class="flex flex-wrap justify-center gap-3">${actionHtml}</div>
</div>
${sectionDivider('cream-light')}
</section>`;
}

export function academyBand(index, content, { id = '', bgOverride } = {}) {
  const academyRhythm = ['bg-white', 'bg-cream', 'bg-white', 'bg-cream'];
  const nextMap = ['cream-light', 'cream', 'cream-light', 'cream', 'white'];
  const bg = bgOverride || academyRhythm[index % academyRhythm.length];
  const nextKey = nextMap[index + 1] || 'white';
  return sectionShell({
    id,
    bg,
    className: SECTION_PAD,
    divider: index < 3,
    nextBg: nextKey,
    reveal: true,
    content,
  });
}

export function courseHero(mentor, title, desc) {
  return `<section class="relative pt-28 pb-12 px-4 sm:px-6 bg-academy-blue text-white">
<div class="${WIDTH.editorial} mx-auto">
<p class="text-orange-light ${EYEBROW} mb-2">${mentor}</p>
<h1 class="text-[clamp(2rem,5vw,3rem)] font-signika font-bold mb-4">${title}</h1>
<p class="text-white/70 font-alan-sans text-lg">${desc}</p>
</div>
${sectionDivider('white')}
</section>`;
}

export function courseBioGrid(course, bio) {
  return contentBand(0, `<div class="${WIDTH.editorial} mx-auto grid md:grid-cols-[40%_60%] gap-10 items-start">
<img src="${course.image}" alt="${course.mentor}" class="rounded-2xl w-full border border-teal-dark/10" loading="lazy" data-blur-up />
<div>
<h2 class="font-signika font-bold text-2xl text-teal-dark mb-4">${bio.name}</h2>
<p class="text-sm text-orange font-alan-sans mb-4">${bio.role}</p>
<p class="font-alan-sans text-black/70 mb-6 leading-relaxed">${bio.bio}</p>
<ul class="space-y-2 mb-8">${bio.credentials.map((c) => `<li class="text-sm font-alan-sans text-black/70">• ${c}</li>`).join('')}</ul>
<a href="/book-a-call" class="${PRIMARY_CTA}">Book a Call</a>
</div>
</div>`, { divider: false });
}

export { bookCallCta, connectStrip, storyIpCard, initiativeCard, sectionShell, tagPill };
