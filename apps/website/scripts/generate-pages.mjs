/**
 * Generate static HTML pages from shared layout shell + page metadata.
 * Run after export-site-data: node scripts/generate-pages.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pageHero,
  bookCallCta,
  sectionShell,
  storyIpCard,
  initiativeCard,
  connectStrip,
  renderArtistPage,
} from './layout-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const site = JSON.parse(readFileSync(join(root, 'src/data/siteContent.json'), 'utf8'));
const roster = JSON.parse(readFileSync(join(root, 'src/data/rosterArtists.json'), 'utf8'));
const constants = JSON.parse(readFileSync(join(root, 'src/data/constants.json'), 'utf8'));

function shell({ title, description, layout = 'marketing', main, script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- partial:head-meta -->
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, '&quot;')}" />
</head>
<body data-layout="${layout}">
<!-- partial:header -->
<main class="min-h-screen bg-cream">${main}</main>
<!-- partial:footer -->
${script ? `<script type="module" src="${script}"></script>` : '<script type="module" src="/src/js/pages/generic.js"></script>'}
</body>
</html>`;
}

function writePage(relPath, html) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
}

const roundwayGrid = site.ROUNDWAY_STAGES.map(
  (s) =>
    `<div class="roundway-step p-5 rounded-2xl border border-teal-dark/10 bg-white text-center"><p class="text-[10px] font-black uppercase tracking-widest text-orange font-alan-sans mb-2">${s.label}</p><h3 class="font-bold font-signika text-lg text-teal-dark mb-1">${s.title}</h3><p class="text-amber-text/80 font-alan-sans text-xs">${s.desc}</p></div>`,
).join('');

// About
writePage(
  'about/index.html',
  shell({
    title: 'About — The Shakti Collective',
    description:
      'Building ecosystems where artists can last through mentorship, systems, collaboration, storytelling, and meaningful artistic development.',
    main: `${pageHero('About TSC', 'Where artists last.', 'Mentorship · Systems · Story · Collab')}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-12 px-4 sm:px-6',
  divider: true,
  reveal: true,
  content: `<div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" data-reveal-stagger>${roundwayGrid}</div>`,
})}
${sectionShell({
  id: 'contact',
  bg: 'bg-cream',
  className: 'py-16 px-4 sm:px-6',
  content: `<div class="max-w-3xl mx-auto"><h2 class="text-3xl font-bold font-signika text-teal-dark text-center mb-10" data-reveal>FAQ</h2><div class="space-y-3 mb-16">${site.ABOUT_FAQ.map(
    (f, i) =>
      `<div class="faq-item border border-teal-dark/10 rounded-xl overflow-hidden bg-white ${i === 0 ? 'is-open' : ''}"><button type="button" class="faq-trigger w-full text-left px-6 py-5 flex items-center justify-between gap-4"><span class="text-base sm:text-lg font-bold font-signika text-teal-dark">${f.q}</span><span class="faq-icon flex-shrink-0 w-6 h-6 rounded-full border border-teal-dark/20 flex items-center justify-center transition-transform">+</span></button><div class="faq-panel"><div class="px-6 pb-6 text-amber-text font-alan-sans text-sm sm:text-base leading-relaxed border-t border-teal-dark/5 pt-4">${f.a}</div></div></div>`,
  ).join('')}</div>
<form id="contact-form" class="space-y-4 bg-white p-6 rounded-2xl border border-teal-dark/10" data-reveal><h3 class="font-signika font-bold text-xl text-teal-dark mb-4">Get in touch</h3><input name="name" required placeholder="Name" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10" /><input name="email" type="email" required placeholder="Email" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10" /><input name="interest" placeholder="Interest (optional)" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10" /><textarea name="message" required rows="4" placeholder="Message" class="w-full px-4 py-3 rounded-xl border border-teal-dark/10"></textarea><button type="submit" class="px-6 py-3 rounded-full bg-orange text-white font-bold">Send</button><p id="contact-message" class="text-sm hidden"></p></form></div>`,
})}
${bookCallCta('Foundations change everything.', 'Book a call when you are ready to build with intent.')}`,
    script: '/src/js/pages/about.js',
  }),
);

// Stories
writePage(
  'stories/index.html',
  shell({
    title: 'Build Stories — The Shakti Collective',
    description: 'Original IPs and cultural initiatives from The Shakti Collective.',
    main: `${pageHero('Build Stories', 'Stories that build culture.', 'IPs · Initiatives · Film')}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-16 px-4 sm:px-6',
  divider: true,
  content: `<div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3" data-reveal-stagger>${site.STORIES_IPS.map((ip, i) => storyIpCard(ip, i)).join('')}</div>
<h2 class="text-center text-xs uppercase tracking-widest text-amber-text font-alan-sans mt-16 mb-6">Initiatives</h2>
<div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3" data-reveal-stagger>${site.STORIES_INITIATIVES.map((item, i) => initiativeCard(item, i)).join('')}</div>
<div class="flex flex-wrap justify-center gap-3 mt-10"><a href="/films" class="px-5 py-2.5 rounded-full border border-teal-dark/15 font-alan-sans text-sm text-teal-dark hover:border-orange hover:text-orange">TSC Films</a><a href="/collab" class="px-5 py-2.5 rounded-full border border-teal-dark/15 font-alan-sans text-sm text-teal-dark hover:border-orange hover:text-orange">Partner</a></div>`,
})}
${bookCallCta('Build with TSC', 'IP · Culture · Campaign')}`,
  }),
);

// Films
writePage(
  'films/index.html',
  shell({
    title: 'TSC Films — Film Mounting & Cultural Movement',
    description: 'Film mounting, audience building, and cultural movement strategy.',
    main: `${pageHero('TSC Films', 'Films deserve a movement.', 'Audience · Culture · Monetisation')}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-12 px-4',
  content: `<div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3" data-reveal-stagger>${site.STORIES_INITIATIVES.map((item, i) => initiativeCard(item, i)).join('')}</div>`,
})}
<section class="bg-teal-dark py-8 px-4"><div class="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">${site.FILMS_STATS.map((s) => `<p class="text-cream/80 font-alan-sans text-sm text-center">${s}</p>`).join('')}</div></section>
${sectionShell({
  bg: 'bg-cream',
  className: 'py-16 px-4',
  divider: true,
  content: `<div class="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12" data-reveal-stagger>${site.FILMS_SERVICES.map((svc) => `<div class="p-6 rounded-2xl border border-teal-dark/10 bg-white"><h3 class="font-signika font-bold text-lg text-teal-dark mb-3">${svc.title}</h3><div class="flex flex-wrap gap-2">${svc.items.slice(0, 4).map((t) => `<span class="text-[10px] px-2 py-1 rounded-full bg-cream font-alan-sans text-amber-text">${t.split(' ')[0]}</span>`).join('')}</div></div>`).join('')}</div>
<div class="flex flex-wrap justify-center gap-2 mb-12">${site.FILMS_APPROACH.map((a) => `<span class="px-4 py-2 rounded-full bg-cream-light border border-teal-dark/10 text-sm font-alan-sans text-teal-dark"><strong>${a.step}</strong> ${a.title}</span>`).join('')}</div>
<div class="rounded-3xl bg-teal-dark text-cream p-8 sm:p-12" data-reveal><h2 class="text-3xl font-signika font-bold mb-6 text-center">Why TSC Films</h2><div class="grid sm:grid-cols-2 gap-4 mb-8"><div class="p-4 rounded-xl bg-cream/5">Beyond Marketing</div><div class="p-4 rounded-xl bg-cream/5">Beyond Release</div><div class="p-4 rounded-xl bg-cream/5">Beyond Campaigns</div><div class="p-4 rounded-xl bg-cream/5">Beyond Box Office</div></div><div class="text-center"><a href="mailto:${constants.FILMS_CONTACT_EMAIL}" class="inline-flex px-6 py-3 rounded-full bg-orange font-bold text-white">Mount Your Film</a></div></div>`,
})}
${bookCallCta('Planning a film launch?', 'Audience · Partnerships · Monetisation')}`,
  }),
);

// Collab
writePage(
  'collab/index.html',
  shell({
    title: 'Collab with TSC — Co-Creating Cultural Currency',
    description: 'Brand partnerships and co-created IP with The Shakti Collective.',
    main: `${pageHero('Brand Partnerships', 'Co-Creating Cultural Currency.', 'Music · Stories · Artists · IP')}
<section class="bg-teal-dark py-8 px-4"><div class="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">${site.COLLAB_VALUE_PROPS.map((v) => `<div class="text-center p-4"><div class="text-2xl mb-2">${v.emoji}</div><p class="text-cream font-alan-sans text-sm">${v.title}</p></div>`).join('')}</div></section>
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-16 px-4',
  divider: true,
  content: `<div class="max-w-6xl mx-auto"><div class="flex flex-wrap gap-2 justify-center mb-10">${site.COLLAB_SERVICES.map((s) => `<span class="px-3 py-1.5 rounded-full bg-white border border-teal-dark/10 text-xs font-alan-sans text-teal-dark">${s}</span>`).join('')}</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12" data-reveal-stagger>${site.STORIES_IPS.map((ip, i) => storyIpCard(ip, i)).join('')}</div>
<div class="grid sm:grid-cols-2 gap-4 mb-10" data-reveal-stagger>${site.COLLAB_CASE_STUDIES.map((c) => `<div class="p-6 rounded-2xl bg-white border border-teal-dark/10"><h3 class="font-signika font-bold text-teal-dark mb-2">${c.title}</h3><p class="text-sm text-amber-text font-alan-sans">${c.desc}</p></div>`).join('')}</div>
<div class="text-center mb-10"><a href="/query" class="inline-flex px-8 py-3 rounded-full bg-orange text-white font-bold font-alan-sans">Partner With TSC</a></div></div>`,
})}
${bookCallCta('Build something culture-first.', 'Brand goals → IP & artist partnerships')}`,
  }),
);

// Artists index
writePage(
  'artists/index.html',
  shell({
    title: 'Artists — The Shakti Collective',
    description: 'Browse the TSC artist roster and book performances.',
    main: `${pageHero('Artists', 'Book world-class talent.', 'Live · Studio · Collab')}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-16 px-4',
  divider: true,
  content: `<div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-6" data-reveal-stagger>${roster.ROSTER_ARTISTS.map(
    (a) =>
      `<article class="rounded-2xl overflow-hidden border border-teal-dark/10 bg-white"><a href="${a.href}"><img src="${a.image}" alt="${a.name}" class="w-full aspect-[4/3] object-cover" loading="lazy" data-blur-up /></a><div class="p-6"><p class="text-[10px] uppercase tracking-widest text-orange font-alan-sans mb-1">${a.role}</p><h2 class="font-signika font-bold text-xl text-teal-dark mb-2"><a href="${a.href}" class="hover:text-orange">${a.name}</a></h2><p class="text-sm text-amber-text font-alan-sans mb-4">${a.tagline}</p><ul class="text-xs text-amber-text/80 space-y-1 mb-4">${a.highlights.map((h) => `<li>• ${h}</li>`).join('')}</ul><div class="flex gap-2"><a href="${a.href}" class="px-4 py-2 rounded-full border border-teal-dark/15 text-sm text-teal-dark hover:border-orange">Profile</a><a href="/query?artist=${encodeURIComponent(a.queryArtist)}" class="px-4 py-2 rounded-full bg-orange text-white text-sm font-semibold">Book</a></div></div></article>`,
  ).join('')}</div>`,
})}
${bookCallCta('Need the right artist?', 'Tell us about your event or collaboration.')}`,
  }),
);

console.log('Generated marketing pages');

// Insights hub
const toolCategories = [
  'All',
  'DAW',
  'Audio Editor',
  'Synth',
  'Effect',
  'Utility',
  'Distribution',
  'Marketing',
  'Collaboration',
];
writePage(
  'insights/index.html',
  shell({
    title: 'Insights — The Shakti Collective',
    description: 'Guides, tools, and systems for independent artists.',
    main: `${pageHero('Resources Hub', 'Resources for artists.', 'Guides · Tools · Systems')}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-16 px-4',
  divider: true,
  content: `<div class="max-w-6xl mx-auto"><p class="text-[10px] uppercase tracking-widest text-orange font-alan-sans mb-2">Insights & Guides</p><h2 class="font-signika font-bold text-2xl text-teal-dark mb-8">From the Blog</h2><div class="grid md:grid-cols-3 gap-6 mb-16" data-reveal-stagger>${site.INSIGHT_RESOURCES.map((r) => `<a href="${r.href}" class="block rounded-2xl overflow-hidden border border-teal-dark/10 bg-white hover:border-orange/40 transition-colors"><div class="p-6"><h3 class="font-signika font-bold text-teal-dark mb-2">${r.title}</h3><p class="text-sm text-amber-text font-alan-sans">${r.excerpt}</p></div></a>`).join('')}</div>
<p class="text-[10px] uppercase tracking-widest text-orange font-alan-sans mb-2">Free Tools</p><h2 class="font-signika font-bold text-2xl text-teal-dark mb-4">Tools for independent artists</h2><div class="flex flex-wrap gap-2 mb-6">${toolCategories.map((c, i) => `<button type="button" data-tool-filter="${c}" class="px-3 py-1.5 rounded-full text-xs font-alan-sans ${i === 0 ? 'bg-orange text-white' : 'bg-teal-dark/5 text-teal-dark'}">${c}</button>`).join('')}</div>
<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${site.FREE_TOOLS.map((t) => `<a href="${t.link}" target="_blank" rel="noopener" data-tool-category="${t.category}" class="tool-card p-5 rounded-2xl border border-teal-dark/10 bg-white hover:border-orange/40 block"><span class="text-[10px] uppercase tracking-widest text-orange font-alan-sans">${t.category}</span><h3 class="font-signika font-bold text-teal-dark mt-1 mb-2">${t.name}</h3><p class="text-xs text-amber-text font-alan-sans">${t.description}</p></a>`).join('')}</div></div>`,
})}
<section class="bg-teal-dark py-16 px-4 text-center text-cream"><h2 class="text-3xl font-signika font-bold mb-6">Next step?</h2><a href="/book-a-call" class="inline-flex px-8 py-3 rounded-full bg-orange font-bold mb-4">Book a Call</a><p><a href="${constants.ARTIST_PATH_FORM_PATH}" class="text-cream/60 hover:text-orange text-sm">Or take the Artist Path questionnaire</a></p></section>`,
    script: '/src/js/pages/insights.js',
  }),
);

for (const article of site.INSIGHT_RESOURCES) {
  const slug = article.href.replace('/insights/', '');
  writePage(
    `insights/${slug}/index.html`,
    shell({
      title: `${article.title} — TSC Insights`,
      description: article.excerpt,
      main: `${pageHero('Insights', article.title, article.excerpt)}
${sectionShell({
  bg: 'bg-cream-light',
  className: 'py-16 px-4',
  content: `<div class="max-w-prose mx-auto font-alan-sans text-amber-text leading-relaxed space-y-4" data-reveal><p>This guide is part of the TSC Resources hub. For personalized guidance, book a call with our team.</p><a href="/book-a-call" class="inline-flex px-6 py-3 rounded-full bg-orange text-white font-bold">Book a Call</a></div>`,
})}`,
    }),
  );
}

// Academy (unchanged palette — blue sub-brand)
writePage(
  'academy/index.html',
  shell({
    title: 'TSC Academy — Learn from the Maestros',
    description: 'Structured mentorship programs led by industry veterans.',
    layout: 'academy',
    main: `<section id="hero" class="pt-28 pb-16 px-4 bg-academy-blue text-white"><div class="max-w-4xl mx-auto text-center"><p class="text-orange-light text-xs uppercase tracking-widest font-alan-sans mb-4">TSC Academy</p><h1 class="text-4xl sm:text-5xl font-signika font-bold mb-4">Learn from the Maestros.</h1><p class="text-white/70 font-alan-sans mb-8">Structured mentorship for artists who want foundations that compound.</p><div class="flex flex-wrap justify-center gap-3"><a href="#courses" class="px-6 py-3 rounded-full bg-orange font-bold">Explore Courses</a><a href="#testimonials" class="px-6 py-3 rounded-full border border-white/30">Testimonials</a></div></div></section>
<section id="why-academy" class="py-16 px-4 bg-white"><div class="max-w-4xl mx-auto text-center mb-10"><p class="text-xs uppercase tracking-widest text-orange font-alan-sans mb-2">Why TSC Academy</p><h2 class="text-3xl font-signika font-bold">Most artists consume endlessly. Few develop intentionally.</h2></div><div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-4"><div class="p-6 rounded-2xl border border-black/8 text-center"><h3 class="font-signika font-bold mb-2">Mentorship-led</h3><p class="text-sm text-black/60 font-alan-sans">Live sessions with practitioners.</p></div><div class="p-6 rounded-2xl border border-black/8 text-center"><h3 class="font-signika font-bold mb-2">Artist-first systems</h3><p class="text-sm text-black/60 font-alan-sans">Workflows that respect your craft.</p></div><div class="p-6 rounded-2xl border border-black/8 text-center"><h3 class="font-signika font-bold mb-2">Community that compounds</h3><p class="text-sm text-black/60 font-alan-sans">Peers who push you forward.</p></div></div></section>
<section id="courses" class="py-16 px-4 bg-cream"><div class="max-w-6xl mx-auto"><h2 class="text-3xl font-signika font-bold text-center mb-10">Courses</h2><div class="grid md:grid-cols-3 gap-6">${site.ACADEMY_COURSES.map((c) => `<a href="${c.link}" class="block rounded-2xl overflow-hidden border border-black/8 bg-white hover:border-orange/30 transition-colors"><img src="${c.image}" alt="" class="w-full aspect-video object-cover" loading="lazy" /><div class="p-6"><p class="text-xs text-orange font-alan-sans mb-1">${c.mentor}</p><h3 class="font-signika font-bold text-lg mb-2">${c.title}</h3><p class="text-sm text-black/60 font-alan-sans">${c.desc}</p></div></a>`).join('')}</div></div></section>
<section id="testimonials" class="py-16 px-4 bg-white"><div class="max-w-6xl mx-auto"><h2 class="text-3xl font-signika font-bold text-center mb-10">Artist Testimonials</h2><div class="grid md:grid-cols-3 gap-6">${site.ACADEMY_TESTIMONIALS.map((t) => `<blockquote class="p-6 rounded-2xl border border-black/8 bg-cream"><img src="${t.image}" alt="${t.name}" class="w-16 h-16 rounded-full object-cover mb-4" loading="lazy" /><p class="text-sm text-black/70 font-alan-sans italic mb-4">"${t.quote}"</p><footer><strong class="font-signika">${t.name}</strong><p class="text-xs text-orange font-alan-sans">${t.role}</p></footer></blockquote>`).join('')}</div></div></section>
<section id="book-a-call" class="py-16 px-4 bg-academy-blue text-white"><div class="max-w-4xl mx-auto text-center"><p class="text-xs uppercase tracking-widest text-orange-light font-alan-sans mb-2">Personal Guidance</p><h2 class="text-3xl font-signika font-bold mb-6">Still unsure where to start? Let's talk.</h2><a href="/book-a-call" class="inline-flex px-8 py-3 rounded-full bg-orange font-bold">Book a Call</a></div></section>
${bookCallCta('Foundations change everything.', 'Clarity leads to confidence.')}
<section id="cta" class="py-16 px-4 bg-white text-center"><h2 class="text-3xl font-signika font-bold mb-6">Ready to Begin Your Musical Journey?</h2><div class="flex flex-wrap justify-center gap-3"><a href="#courses" class="px-6 py-3 rounded-full bg-orange text-white font-bold">View Courses</a><a href="/masterclass/sandesh-shandilya" class="px-6 py-3 rounded-full border border-black/10">Masterclass</a></div></section>`,
    script: '/src/js/pages/academy.js',
  }),
);

writePage(
  'academy/ambassador/index.html',
  shell({
    title: 'Ambassador Program — TSC Academy',
    description: 'TSC Academy ambassador program for emerging artists.',
    layout: 'academy',
    main: `${pageHero('Ambassador Program', 'Represent TSC Academy.', 'Community · Leadership · Growth')}
<section class="py-16 px-4 max-w-prose mx-auto font-alan-sans text-amber-text"><p>Join the TSC Academy ambassador community. Apply through Artist Path or book a call to learn more.</p><div class="mt-8 flex gap-3"><a href="/artist-path" class="px-6 py-3 rounded-full bg-orange text-white font-bold">Artist Path</a><a href="/book-a-call" class="px-6 py-3 rounded-full border border-teal-dark/15 text-teal-dark">Book a Call</a></div></section>`,
  }),
);

for (const course of site.ACADEMY_COURSES) {
  const slug = course.link.replace('/courses/', '');
  const mentorKey = slug.includes('composition') ? 'sandesh' : slug.includes('hindustani') ? 'prasad' : 'luca';
  const bio = site.MENTOR_BIOS[mentorKey];
  writePage(
    `courses/${slug}/index.html`,
    shell({
      title: `${course.title} — TSC Academy`,
      description: course.desc,
      layout: 'course',
      main: `<section class="pt-28 pb-12 px-4 bg-academy-blue text-white"><div class="max-w-4xl mx-auto"><p class="text-orange-light text-xs uppercase tracking-widest mb-2">${course.mentor}</p><h1 class="text-4xl font-signika font-bold mb-4">${course.title}</h1><p class="text-white/70 font-alan-sans">${course.desc}</p></div></section>
<section class="py-16 px-4"><div class="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start"><img src="${course.image}" alt="${course.mentor}" class="rounded-2xl w-full" loading="lazy" /><div><h2 class="font-signika font-bold text-2xl mb-4">${bio.name}</h2><p class="text-sm text-orange font-alan-sans mb-4">${bio.role}</p><p class="font-alan-sans text-black/70 mb-6">${bio.bio}</p><ul class="space-y-2 mb-6">${bio.credentials.map((c) => `<li class="text-sm font-alan-sans">• ${c}</li>`).join('')}</ul><a href="/book-a-call" class="inline-flex px-6 py-3 rounded-full bg-orange text-white font-bold">Book a Call</a></div></div></section>`,
    }),
  );
}

writePage(
  'masterclass/sandesh-shandilya/index.html',
  shell({
    title: 'Sandesh Shandilya Masterclass — TSC Academy',
    description: 'Learn composition from award-winning Bollywood composer Sandesh Shandilya.',
    layout: 'academy',
    main: `${pageHero('Masterclass', 'Sandesh Shandilya', 'The heART of Composition')}<section class="py-16 px-4 text-center"><a href="/courses/composition-comprehensive" class="px-6 py-3 rounded-full bg-orange text-white font-bold">View Full Course</a></section>`,
  }),
);

writePage(
  'masterclass/prasad-khaparde/index.html',
  shell({
    title: 'Prasad Khaparde Masterclass — TSC Academy',
    description: 'Hindustani classical mentorship with Pandit Prasad Khaparde.',
    layout: 'academy',
    main: `${pageHero('Masterclass', 'Pandit Prasad Khaparde', 'Roots of Hindustani Classical')}<section class="py-16 px-4 text-center"><a href="/courses/hindustani-classical" class="px-6 py-3 rounded-full bg-orange text-white font-bold">View Full Course</a></section>`,
  }),
);

// Form pages
const formShell = (title, desc, formId, steps, script) =>
  shell({
    title,
    description: desc,
    layout: 'form',
    main: `${sectionShell({
      bg: 'bg-cream',
      className: 'pt-28 pb-16 px-4 min-h-screen',
      content: `<div class="max-w-xl mx-auto"><div id="form-root" data-form="${formId}" data-steps="${steps}"></div></div>`,
    })}`,
    script,
  });

writePage(
  'book-a-call/index.html',
  formShell('Book a Call — TSC', 'Schedule a consultation with The Shakti Collective.', 'book-call', '4', '/src/js/forms/book-call.js'),
);
writePage(
  'query/index.html',
  formShell('Book an Artist — TSC', 'Artist booking and collaboration inquiry.', 'query', '3', '/src/js/forms/query.js'),
);
writePage(
  'artist-path/index.html',
  formShell('Artist Path — TSC', 'Personalized growth roadmap application.', 'artist-path', '5', '/src/js/forms/artist-path.js'),
);

// Artist profiles — editorial template
for (const artist of roster.ROSTER_ARTISTS) {
  writePage(
    `${artist.slug}/index.html`,
    shell({
      title: `${artist.name} | TSC`,
      description: artist.tagline,
      layout: 'marketing',
      main: renderArtistPage(artist),
    }),
  );
}

writePage(
  'links/harshad-and-duhita/index.html',
  shell({
    title: 'Harshaduhita — Links',
    description: 'Quick links',
    main: sectionShell({
      bg: 'bg-cream',
      className: 'py-32 px-4 text-center',
      content: `<a href="/harshadduhita" class="text-orange font-bold font-signika text-lg">View full profile</a>`,
    }),
  }),
);
writePage(
  'links/yugm/index.html',
  shell({
    title: 'Yugm — Links',
    description: 'Quick links',
    main: sectionShell({
      bg: 'bg-cream',
      className: 'py-32 px-4 text-center',
      content: `<a href="/yugm" class="text-orange font-bold font-signika text-lg">View full profile</a>`,
    }),
  }),
);

writePage(
  'classicalreview/index.html',
  shell({
    title: 'Classical Review',
    description: 'Review form',
    layout: 'review',
    main: `<section class="py-16 px-4 min-h-screen bg-[#050505] text-white"><div class="max-w-xl mx-auto" id="review-root" data-review="classical"></div></section>`,
    script: '/src/js/forms/review.js',
  }),
);
writePage(
  'masterclass-review01/index.html',
  shell({
    title: 'Masterclass Review',
    description: 'Review form',
    layout: 'review',
    main: `<section class="py-16 px-4 min-h-screen bg-[#050505] text-white"><div class="max-w-xl mx-auto" id="review-root" data-review="review01"></div></section>`,
    script: '/src/js/forms/review.js',
  }),
);
writePage(
  'masterclass-review02/index.html',
  shell({
    title: 'Masterclass Review',
    description: 'Review form',
    layout: 'review',
    main: `<section class="py-16 px-4 min-h-screen bg-[#050505] text-white"><div class="max-w-xl mx-auto" id="review-root" data-review="review02"></div></section>`,
    script: '/src/js/forms/review.js',
  }),
);

console.log('Generated all static pages');
