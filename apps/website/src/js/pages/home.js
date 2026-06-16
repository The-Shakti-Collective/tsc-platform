import { initSite } from '../site.js';
import { initHeroRotate, renderHeroCtas } from '../hero-rotate.js';
import siteContent from '../../data/siteContent.json';
import navData from '../../data/navigation.json';

initSite();
initHeroRotate();
renderHeroCtas(document.getElementById('hero-ctas'));

function bookCallCard(title, desc) {
  return `
  <div class="rounded-3xl bg-teal-dark text-cream p-8 sm:p-10 text-center" data-reveal>
    <h2 class="text-2xl sm:text-3xl font-bold font-signika mb-3">${title}</h2>
    <p class="text-cream/70 font-alan-sans text-sm sm:text-base mb-6 max-w-lg mx-auto">${desc}</p>
    <a href="/book-a-call" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange text-white font-bold font-alan-sans text-sm hover:bg-orange/90 transition-colors">Book a Call</a>
  </div>`;
}

function connectStrip() {
  const links = [
    ['Instagram', navData.SOCIAL_LINKS.instagram],
    ['YouTube', navData.SOCIAL_LINKS.youtube],
    ['LinkedIn', navData.SOCIAL_LINKS.linkedin],
  ];
  const pills = links
    .map(
      ([label, href]) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-flex px-5 py-2.5 rounded-full border border-teal-dark/25 text-teal-dark font-alan-sans text-sm hover:border-orange hover:text-orange transition-colors">${label}</a>`,
    )
    .join('');
  return `<div class="max-w-4xl mx-auto text-center mb-10" data-reveal>
<p class="text-xs uppercase tracking-[0.25em] text-amber-text font-alan-sans mb-2">Connect</p>
<h2 class="font-signika font-bold text-2xl text-teal-dark mb-6">Join the movement</h2>
<div class="flex flex-wrap justify-center gap-3">${pills}</div>
</div>`;
}

function renderHomeSections() {
  const about = document.getElementById('home-about');
  if (about) {
    about.innerHTML = `
      <div class="max-w-4xl mx-auto text-center mb-10" data-reveal>
        <h2 class="text-3xl sm:text-4xl font-bold font-signika text-teal-dark mb-3">${siteContent.HOME_ABOUT.headline}</h2>
        <p class="text-amber-text font-alan-sans">${siteContent.HOME_ABOUT.tagline}</p>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto" data-reveal-stagger>
        ${siteContent.HOME_ABOUT.pillars
          .map(
            (p) =>
              `<a href="${p.href}" class="p-5 rounded-2xl border border-teal-dark/10 bg-white hover:border-orange/40 text-center transition-colors"><span class="font-signika font-bold text-teal-dark">${p.label}</span></a>`,
          )
          .join('')}
      </div>`;
  }

  const meteor = document.getElementById('home-meteor');
  if (meteor) {
    meteor.innerHTML = `
      <h2 class="text-3xl sm:text-4xl font-bold font-signika text-teal-dark text-center mb-2" data-reveal>${siteContent.METEOR_EFFECT.headline}</h2>
      <p class="text-center text-amber-text font-alan-sans mb-10" data-reveal>${siteContent.METEOR_EFFECT.subheadline}</p>
      <div class="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-8" data-reveal-stagger>
        ${siteContent.METEOR_EFFECT.stats
          .map(
            (s) =>
              `<div class="text-center p-4 rounded-2xl bg-white border border-teal-dark/10"><div class="text-2xl sm:text-3xl font-bold font-signika text-orange">${s.value}</div><div class="text-xs text-amber-text font-alan-sans mt-1">${s.label}</div></div>`,
          )
          .join('')}
      </div>
      <p class="text-center font-signika font-semibold text-lg text-teal-dark" data-reveal>${siteContent.METEOR_EFFECT.closing}</p>`;
  }

  const solution = document.getElementById('home-solution');
  if (solution) {
    solution.innerHTML = `
      <h2 class="text-3xl sm:text-4xl font-bold font-signika text-teal-dark text-center mb-10" data-reveal>The Roundway</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-6xl mx-auto" data-reveal-stagger>
        ${siteContent.ROUNDWAY_STAGES.map(
          (stage) =>
            `<div class="roundway-step p-5 rounded-2xl border border-teal-dark/10 bg-white text-center"><p class="text-[10px] font-black uppercase tracking-widest text-orange font-alan-sans mb-2">${stage.label}</p><h3 class="font-bold font-signika text-lg text-teal-dark mb-1">${stage.title}</h3><p class="text-amber-text/80 font-alan-sans text-xs">${stage.desc}</p></div>`,
        ).join('')}
      </div>`;
  }

  const build = document.getElementById('home-build');
  if (build) {
    build.innerHTML = `
      <h2 class="text-3xl sm:text-4xl font-bold font-signika text-teal-dark text-center mb-10" data-reveal>What we build</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto" data-reveal-stagger>
        ${siteContent.WHAT_WE_BUILD.map(
          (item) =>
            `<a href="${item.href}" class="group relative overflow-hidden rounded-2xl border border-teal-dark/10 aspect-[4/3] block"><img src="${item.image}" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" loading="lazy" data-blur-up /><div class="absolute inset-0 bg-gradient-to-t from-teal-dark/85 via-teal-dark/20 to-transparent pointer-events-none"></div><div class="absolute bottom-0 left-0 right-0 p-5 text-cream"><span class="text-[10px] uppercase tracking-widest text-orange-light font-alan-sans">${item.tag}</span><h3 class="font-signika font-bold text-xl">${item.title}</h3></div></a>`,
        ).join('')}
      </div>`;
  }

  const who = document.getElementById('home-who');
  if (who) {
    who.innerHTML = `
      <h2 class="text-3xl sm:text-4xl font-bold font-signika text-teal-dark text-center mb-10" data-reveal>Who this is for</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto" data-reveal-stagger>
        ${siteContent.WHO_THIS_IS_FOR.map(
          (item) =>
            `<div class="p-6 rounded-2xl border border-teal-dark/10 bg-white text-center"><div class="text-3xl mb-3">${item.emoji}</div><p class="font-alan-sans text-sm text-amber-text">${item.label}</p></div>`,
        ).join('')}
      </div>`;
  }

  const cta = document.getElementById('home-final-cta');
  if (cta) {
    cta.innerHTML = `${connectStrip()}${bookCallCard('Ready when you are.', 'Book a call or explore the path that fits your journey.')}`;
  }
}

renderHomeSections();
