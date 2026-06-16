/**
 * Harshaduhita Collective — editorial artist page (reference design).
 * Uses TSC marketing header/footer; body matches terracotta / burgundy / cream layout.
 */

function dividerTerracottaToCream() {
  return `<div class="harshad-divider" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path fill="#fff5e8" d="M0,64 C180,120 360,24 540,72 C720,120 900,32 1080,64 C1260,96 1320,88 1440,72 L1440,120 L0,120 Z"/></svg></div>`;
}

function dividerCreamToTerracotta() {
  return `<div class="harshad-divider" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path fill="#c4542f" d="M0,48 C240,96 480,0 720,48 C960,96 1200,16 1440,48 L1440,0 L0,0 Z"/></svg></div>`;
}

function dividerTerracottaToBurgundy() {
  return `<div class="harshad-divider" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path fill="#5c1828" d="M0,72 C200,24 400,96 600,48 C800,0 1000,88 1200,56 C1320,36 1380,44 1440,52 L1440,120 L0,120 Z"/></svg></div>`;
}

function dividerBurgundyToCream() {
  return `<div class="harshad-divider" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path fill="#fff5e8" d="M0,56 C180,104 360,16 540,64 C720,112 900,24 1080,56 C1260,88 1380,72 1440,64 L1440,120 L0,120 Z"/></svg></div>`;
}

function dividerCreamToBurgundy() {
  return `<div class="harshad-divider" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path fill="#5c1828" d="M0,64 C220,16 440,96 660,40 C880,0 1100,80 1320,48 L1440,32 L1440,0 L0,0 Z"/></svg></div>`;
}

function spiralDecor(position) {
  const cls = position === 'left' ? 'harshad-spiral harshad-spiral--left text-white' : 'harshad-spiral harshad-spiral--right text-white';
  return `<svg class="${cls}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M100 20c44 0 80 36 80 80s-36 80-80 80-80-36-80-80 36-80 80-80z" stroke="currentColor" stroke-width="2"/><path d="M100 40c33 0 60 27 60 60s-27 60-60 60-60-27-60-60 27-60 60-60z" stroke="currentColor" stroke-width="2"/><path d="M100 62c21 0 38 17 38 38s-17 38-38 38-38-17-38-38 17-38 38-38z" stroke="currentColor" stroke-width="2"/></svg>`;
}

function genreMarquee(rows) {
  const rowHtml = (items, reverse) => {
    const doubled = [...items, ...items]
      .map((t) => `<span class="harshad-genre-pill">${t}</span>`)
      .join('');
    return `<div class="marquee-row ${reverse ? 'marquee-row--reverse' : ''}"><div class="marquee-track">${doubled}</div></div>`;
  };
  return `<div class="marquee-wrap space-y-4 mt-12">${rows.row1?.length ? rowHtml(rows.row1, false) : ''}${rows.row2?.length ? rowHtml(rows.row2, true) : ''}</div>`;
}

function mediaCard({ title, subtitle, href, image, badge = '▶' }) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="harshad-media-card block" data-reveal>
<span class="harshad-play-badge" aria-hidden="true">${badge}</span>
<img src="${image}" alt="${title}" loading="lazy" data-blur-up />
<div class="harshad-media-title">
<h3 class="font-editorial text-3xl md:text-4xl font-semibold text-white">${title}</h3>
${subtitle ? `<p class="text-white/75 text-sm mt-1 font-alan-sans tracking-wide">${subtitle}</p>` : ''}
</div>
</a>`;
}

function milestoneRow(m, image, align) {
  const isLeft = align === 'left';
  return `<div class="relative grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-20" data-reveal>
<div class="${isLeft ? 'md:order-1' : 'md:order-2'}">
<img src="${image}" alt="" class="rounded-lg shadow-2xl w-full max-w-md mx-auto aspect-[4/3] object-cover" loading="lazy" data-blur-up />
</div>
<div class="${isLeft ? 'md:order-2 md:pl-6' : 'md:order-1 md:pr-6 md:text-right'}">
<p class="text-white/70 text-xs uppercase tracking-[0.35em] mb-2 font-alan-sans">${m.year}</p>
<h3 class="font-editorial text-3xl md:text-4xl text-white mb-3">${m.title}</h3>
<p class="text-white/85 font-alan-sans leading-relaxed max-w-md ${isLeft ? '' : 'md:ml-auto'}">${m.description}</p>
</div>
</div>`;
}

export function renderHarshadduhitaPage(artist) {
  const query = encodeURIComponent(artist.queryArtist);
  const members = artist.members || [];
  const milestones = artist.milestones || [];
  const repertoire = artist.repertoire || { row1: [], row2: [] };
  const discography = artist.discography || [];

  const milestoneImages = [
    '/artists/harshadduhita/milestone-award.jpg',
    '/artists/harshadduhita/milestone-igt.jpg',
    '/artists/harshadduhita/milestone-gananayaka.jpg',
  ];

  const trackImages = [
    '/artists/harshadduhita/track-gananayaka.png',
    '/artists/harshadduhita/track-murchana.jpg',
    '/artists/harshadduhita/track-igt.jpg',
  ];

  const tracks = discography.map((track, i) =>
    mediaCard({
      title: track.title,
      subtitle: track.genre,
      href: track.youtubeUrl || track.spotifyUrl || '#',
      image: trackImages[i] || '/artists/harshadduhita/hero.jpg',
      badge: track.youtubeUrl ? '▶' : '♫',
    }),
  );

  return `
<section class="relative pt-28 md:pt-32 pb-0 overflow-hidden" style="background:#c4542f">
<div class="harshad-texture"></div>
<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
<div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
<div data-reveal>
<h1 class="font-editorial text-white text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.05] font-semibold mb-5">${artist.name}</h1>
<p class="text-white/90 text-lg md:text-xl font-alan-sans leading-relaxed max-w-xl mb-8">${artist.tagline}</p>
<div class="flex flex-wrap gap-3 mb-6">
<a href="/query?artist=${query}" class="harshad-btn-primary">Inquire Online</a>
<a href="#listen" class="harshad-btn-outline">Explore Music ↓</a>
</div>
${artist.award ? `<p class="text-white/80 text-xs uppercase tracking-[0.3em] font-alan-sans">Winner — ${artist.award}</p>` : ''}
</div>
<div class="relative mx-auto w-full max-w-md lg:max-w-none" data-reveal>
<div class="harshad-hero-glow"></div>
<div class="harshad-portrait-ring aspect-[3/4] max-h-[560px] mx-auto lg:ml-auto lg:mr-0 w-[min(100%,420px)]">
<img src="/artists/harshadduhita/hero.jpg" alt="${artist.name}" loading="eager" data-blur-up data-parallax="0.8" />
</div>
</div>
</div>
</div>
${dividerTerracottaToCream()}
</section>

<section class="relative bg-[#fff5e8] text-[#5c1828] py-20 md:py-28 overflow-hidden">
${dividerCreamToTerracotta()}
<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
<div class="grid lg:grid-cols-[38%_62%] gap-10 lg:gap-14 items-start">
<div class="harshad-card-burgundy p-6 md:p-8 text-white" data-reveal>
<h2 class="font-editorial text-4xl md:text-5xl mb-6">Who Are We?</h2>
<img src="/artists/harshadduhita/couple.jpg" alt="Harshad and Duhita" class="rounded-xl w-full aspect-[4/5] object-cover mb-6" loading="lazy" data-blur-up />
<p class="font-alan-sans text-white/90 leading-relaxed text-sm md:text-base">${artist.bio || ''}</p>
</div>
<div class="pt-4 lg:pt-8" data-reveal>
${members
  .map(
    (m, i) => `<div class="${i ? 'mt-8 pt-8 border-t border-[#5c1828]/15' : ''}">
<h3 class="font-editorial text-2xl md:text-3xl text-[#5c1828] mb-3">${m.name}</h3>
<p class="font-alan-sans text-[#7a3a1d] leading-relaxed">${m.bio}</p>
</div>`,
  )
  .join('')}
<ul class="mt-10 space-y-3">${(artist.highlights || [])
    .map((h) => `<li class="flex items-start gap-3 font-alan-sans text-[#7a3a1d]"><span class="text-[#c4542f] mt-1">◆</span><span>${h}</span></li>`)
    .join('')}</ul>
<a href="/artists" class="inline-block mt-10 text-[#c4542f] font-semibold font-alan-sans hover:underline">← Back to roster</a>
</div>
</div>
</div>
${dividerTerracottaToCream()}
</section>

<section class="relative py-20 md:py-28 overflow-hidden" style="background:#c4542f">
<div class="harshad-texture"></div>
${spiralDecor('left')}
${spiralDecor('right')}
<div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
<p class="text-center text-white/75 uppercase tracking-[0.35em] text-xs mb-3 font-alan-sans" data-reveal>Achievements & Milestones</p>
<h2 class="font-editorial text-center text-white text-4xl md:text-5xl mb-14 md:mb-20" data-reveal>Milestones</h2>
<div class="relative">
<div class="harshad-timeline-line hidden md:block"></div>
${milestones.map((m, i) => milestoneRow(m, milestoneImages[i] || '/artists/harshadduhita/hero.jpg', i % 2 === 0 ? 'left' : 'right')).join('')}
</div>
</div>
${dividerTerracottaToBurgundy()}
</section>

<section class="relative py-20 md:py-28 overflow-hidden" style="background:#5c1828">
<div class="harshad-texture opacity-10"></div>
<div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
<p class="font-editorial text-white text-[clamp(2rem,5vw,3.75rem)] leading-tight max-w-4xl mx-auto mb-4" data-reveal>${artist.spectacleBody || 'Emotionally immersive performances rooted in Indian musical traditions.'}</p>
<p class="text-white/70 font-alan-sans mb-2" data-reveal>Performance Genres</p>
${genreMarquee(repertoire)}
</div>
${dividerBurgundyToCream()}
</section>

<section id="listen" class="relative bg-[#fff5e8] py-20 md:py-28 overflow-hidden">
<div class="harshad-texture opacity-20" style="filter:hue-rotate(15deg)"></div>
<div class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
<h2 class="font-editorial text-center text-[#5c1828] text-4xl md:text-5xl mb-12 md:mb-16" data-reveal>Listen & Watch</h2>
<div class="space-y-8 md:space-y-10" data-reveal-stagger>${tracks.join('')}</div>
</div>
${dividerCreamToBurgundy()}
</section>

<section class="relative harshad-contact-panel py-20 md:py-28">
<div class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center" data-reveal>
<h2 class="font-editorial text-white text-4xl md:text-5xl mb-4">Stay in Touch</h2>
<p class="text-white/80 font-alan-sans mb-10 max-w-lg mx-auto">${artist.bookingBody || 'Available for global events — from destination weddings to stadium concerts.'}</p>
<div class="flex flex-wrap justify-center gap-3">
<a href="/query?artist=${query}" class="harshad-btn-primary">Book the Collective</a>
<a href="https://www.youtube.com/@theHarshaduhitacollective" target="_blank" rel="noopener noreferrer" class="harshad-btn-outline">YouTube Channel</a>
</div>
${(artist.social || []).length ? `<div class="flex flex-wrap justify-center gap-3 mt-10">${artist.social
    .slice(0, 4)
    .map(
      (s) =>
        `<a href="${s.href}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="harshad-genre-pill text-sm">${s.label}</a>`,
    )
    .join('')}</div>` : ''}
</div>
</section>`;
}
