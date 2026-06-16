/**
 * Generate static HTML pages — TSC Design Language v1.0 page blueprints.
 * Primitives: Hero → Narrative → Proof → Connection → Conversion
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderArtistPage } from './layout-helpers.mjs';
import { renderHarshadduhitaPage } from './harshadduhita-page.mjs';
import { SECTION_PAD, WIDTH, PRIMARY_CTA, SECONDARY_CTA, EYEBROW, H2, BODY } from './design-tokens.mjs';
import {
  marketingHero,
  contentBand,
  narrativeCenter,
  proofHeader,
  proofCard,
  statsBand,
  conversionBand,
  conversionCard,
  roundwayStep,
  rosterCard,
  resourceCard,
  toolCard,
  faqBlock,
  contactForm,
  mediaProofGrid,
  secondaryPills,
  pageFooter,
  academyHero,
  academyBand,
  courseHero,
  courseBioGrid,
  storyIpCard,
  initiativeCard,
  tagPill,
} from './page-builders.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const site = JSON.parse(readFileSync(join(root, 'src/data/siteContent.json'), 'utf8'));
const roster = JSON.parse(readFileSync(join(root, 'src/data/rosterArtists.json'), 'utf8'));
const constants = JSON.parse(readFileSync(join(root, 'src/data/constants.json'), 'utf8'));

function shell({ title, description, layout = 'marketing', main, mainClass = 'min-h-screen bg-cream', script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- partial:head-meta -->
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, '&quot;')}" />
</head>
<body data-layout="${layout}">
<!-- partial:header -->
<main class="${mainClass}">${main}</main>
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

const INSIGHT_ARTICLE_BODIES = site.INSIGHT_ARTICLE_BODIES || {};
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

// ─── About ─── Hero · Narrative · Proof (Roundway) · Connection (FAQ) · Conversion
writePage(
  'about/index.html',
  shell({
    title: 'About — The Shakti Collective',
    description:
      'Building ecosystems where artists can last through mentorship, systems, collaboration, storytelling, and meaningful artistic development.',
    main: `${marketingHero('About TSC', site.ABOUT_PAGE.headline, 'Mentorship · Systems · Story · Collab')}
${contentBand(0, narrativeCenter('', site.ABOUT_PAGE.headline, `<p>${site.ABOUT_PAGE.intro}</p>`))}
${contentBand(
  1,
  `${narrativeCenter('Mission', site.ABOUT_PAGE.mission.headline, `<p>${site.ABOUT_PAGE.mission.body}</p>`)}
<div class="max-w-3xl mx-auto text-center mt-12 mb-10" data-reveal>
<h2 class="font-signika font-bold text-2xl text-teal-dark mb-3">${site.ABOUT_PAGE.model.headline}</h2>
<p class="font-alan-sans text-amber-text mb-2">${site.ABOUT_PAGE.model.body}</p>
<p class="text-sm text-teal-mid font-alan-sans">${site.ROUNDWAY_SUBHEADLINE}</p>
</div>
${mediaProofGrid(site.ROUNDWAY_STAGES, roundwayStep, { columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' })}`,
)}
${contentBand(
  2,
  `<div class="${WIDTH.narrative} mx-auto">
${proofHeader('Support', 'FAQ', '')}
${faqBlock(site.ABOUT_FAQ)}
${contactForm()}
</div>`,
  { id: 'contact', divider: false },
)}
${pageFooter(site.ACADEMY_PAGE.finalCta.headline, site.ACADEMY_PAGE.finalCta.body)}`,
    script: '/src/js/pages/about.js',
  }),
);

// ─── Stories ─── Hero · Proof (IPs + initiatives) · Conversion
writePage(
  'stories/index.html',
  shell({
    title: 'Build Stories — The Shakti Collective',
    description: 'Original IPs and cultural initiatives from The Shakti Collective.',
    main: `${marketingHero('Build Stories', site.STORIES_PAGE.headline, site.STORIES_PAGE.subheadline)}
${contentBand(
  0,
  `${proofHeader('Original IP', 'Stories & Initiatives', site.STORIES_PAGE.subheadline)}
${mediaProofGrid(site.STORIES_IPS, (ip, i) => storyIpCard(ip, i))}
${proofHeader('Initiatives', 'Cultural Programs', '')}
${mediaProofGrid(site.STORIES_INITIATIVES, (item, i) => initiativeCard(item, i))}
${secondaryPills([
  ['TSC Films', '/films'],
  ['Partner', '/collab'],
])}`,
  { divider: false },
)}
${pageFooter('Build with TSC', 'IP · Culture · Campaign')}`,
  }),
);

// ─── Films ─── Hero · Narrative · Proof (work) · Stats · Proof (services) · Conversion
writePage(
  'films/index.html',
  shell({
    title: 'TSC Films — Film Mounting & Cultural Movement',
    description: 'Film mounting, audience building, and cultural movement strategy.',
    main: `${marketingHero('TSC Films', site.FILMS_PAGE.headline, site.FILMS_PAGE.subheadline)}
${contentBand(
  0,
  narrativeCenter('Narrative', site.FILMS_PAGE.belief.headline, site.FILMS_PAGE.intro.map((p) => `<p>${p}</p>`).join('')),
)}
${contentBand(
  1,
  `${narrativeCenter('', site.FILMS_PAGE.belief.headline, `<p>${site.FILMS_PAGE.belief.body}</p>`)}
<div class="mt-12">${mediaProofGrid(site.STORIES_INITIATIVES, (item, i) => initiativeCard(item, i))}</div>`,
)}
${contentBand(
  2,
  `${proofHeader('Proof', 'Selected Work', '')}
<div class="grid md:grid-cols-3 gap-6" data-reveal-stagger>${site.FILMS_WORK.map((w) => proofCard(w.title, w.desc)).join('')}</div>`,
)}
${statsBand(site.FILMS_STATS)}
${contentBand(
  3,
  `${proofHeader('Services', 'What We Mount', '')}
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12" data-reveal-stagger>${site.FILMS_SERVICES.map((svc) => proofCard(svc.title, svc.items.slice(0, 3).join(' · '))).join('')}</div>
<div class="flex flex-wrap justify-center gap-2 mb-12">${site.FILMS_APPROACH.map((a) => `<span class="px-4 py-2 rounded-full bg-cream border border-teal-dark/10 text-sm font-alan-sans text-teal-dark"><strong>${a.step}</strong> ${a.title}</span>`).join('')}</div>
${conversionCard('Why TSC Films', site.FILMS_PAGE.vision, { email: constants.FILMS_CONTACT_EMAIL, label: 'Mount Your Film' })}`,
  { divider: false },
)}
${pageFooter('Planning a film launch?', 'Audience · Partnerships · Monetisation')}`,
  }),
);

// ─── Collab ─── Hero · Narrative · Proof (stats) · Proof (cases) · Conversion
writePage(
  'collab/index.html',
  shell({
    title: 'Collab with TSC — Co-Creating Cultural Currency',
    description: 'Brand partnerships and co-created IP with The Shakti Collective.',
    main: `${marketingHero('Brand Partnerships', site.COLLAB_PAGE.headline, site.COLLAB_PAGE.subheadline)}
${contentBand(0, narrativeCenter('Narrative', site.COLLAB_PAGE.headline, site.COLLAB_PAGE.body.map((p) => `<p>${p}</p>`).join('')))}
${statsBand(
  site.COLLAB_VALUE_PROPS.map((v) => ({ value: v.emoji, label: v.title })),
  { columns: 4 },
)}
${contentBand(
  1,
  `${proofHeader('Proof', 'Partnership Surface', '')}
<div class="flex flex-wrap gap-2 justify-center mb-10">${site.COLLAB_SERVICES.map((s) => tagPill(s)).join('')}</div>
${mediaProofGrid(site.STORIES_IPS, (ip, i) => storyIpCard(ip, i))}
<div class="grid sm:grid-cols-2 gap-4 mt-10 mb-10" data-reveal-stagger>${site.COLLAB_CASE_STUDIES.map((c) => proofCard(c.title, c.desc)).join('')}</div>
<div class="text-center"><a href="/query" class="${PRIMARY_CTA}">Partner With TSC</a></div>`,
  { divider: false },
)}
${pageFooter('Build something culture-first.', 'Brand goals → IP & artist partnerships')}`,
  }),
);

// ─── Artists ───
writePage(
  'artists/index.html',
  shell({
    title: 'Artists — The Shakti Collective',
    description: 'Browse the TSC artist roster and book performances.',
    main: `${marketingHero('Artists', 'Every artist\u2019s journey is different.', 'Book · Grow · Collaborate')}
${contentBand(
  0,
  `<div class="${WIDTH.narrative} mx-auto text-center" data-reveal>
<p class="font-alan-sans text-amber-text leading-relaxed mb-6">${site.ARTIST_ECOSYSTEM.pathBody}</p>
<ul class="text-sm text-teal-dark font-alan-sans space-y-1 mb-8">${site.ARTIST_ECOSYSTEM.pathIncludes.map((i) => `<li>• ${i}</li>`).join('')}</ul>
<div class="flex flex-wrap justify-center gap-3">
<a href="/artist-path" class="${PRIMARY_CTA}">Start Artist Path</a>
<a href="/query" class="${SECONDARY_CTA}">Book an Artist</a>
</div>
</div>`,
)}
${contentBand(
  1,
  `${proofHeader('Roster', 'TSC Artists', site.ARTIST_ECOSYSTEM.pathHeadline)}
<div class="grid md:grid-cols-3 gap-6" data-reveal-stagger>${roster.ROSTER_ARTISTS.map(rosterCard).join('')}</div>`,
  { divider: false },
)}
${pageFooter('Need the right artist?', 'Tell us about your event or collaboration.')}`,
  }),
);

// ─── Insights ─── Hero · Proof (articles + tools) · Conversion
writePage(
  'insights/index.html',
  shell({
    title: 'Insights — The Shakti Collective',
    description: 'Guides, tools, and systems for independent artists.',
    main: `${marketingHero('Resources Hub', site.INSIGHTS_PAGE.headline, site.INSIGHTS_PAGE.subheadline)}
${contentBand(
  0,
  `${proofHeader('Insights & Guides', 'From the Blog', '')}
<div class="grid md:grid-cols-3 gap-6 mb-16" data-reveal-stagger>${site.INSIGHT_RESOURCES.map(resourceCard).join('')}</div>
${proofHeader('Free Tools', 'Tools for Independent Artists', '')}
<div class="flex flex-wrap gap-2 mb-6">${toolCategories.map((c, i) => `<button type="button" data-tool-filter="${c}" class="px-3 py-1.5 rounded-full text-xs font-alan-sans ${i === 0 ? 'bg-orange text-white' : 'bg-teal-dark/5 text-teal-dark'}">${c}</button>`).join('')}</div>
<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${site.FREE_TOOLS.map(toolCard).join('')}</div>`,
  { divider: false },
)}
${conversionBand('Next step?', 'Personal guidance for your practice or release plan.', {
  tertiary: { href: constants.ARTIST_PATH_FORM_PATH, label: 'Or take the Artist Path questionnaire' },
})}`,
    script: '/src/js/pages/insights.js',
  }),
);

for (const article of site.INSIGHT_RESOURCES) {
  const slug = article.href.replace('/insights/', '');
  const body = INSIGHT_ARTICLE_BODIES[slug] || `<p>${article.excerpt}</p>`;
  writePage(
    `insights/${slug}/index.html`,
    shell({
      title: `${article.title} — TSC Insights`,
      description: article.excerpt,
      main: `${marketingHero('Insights', article.title, article.excerpt)}
${contentBand(
  0,
  `<div class="${WIDTH.narrative} mx-auto font-alan-sans text-amber-text leading-relaxed space-y-4" data-reveal>
${body}
<p class="pt-4">For personalized guidance on your practice or release plan, book a call with our team.</p>
<div class="flex flex-wrap gap-3 pt-4">
<a href="/book-a-call" class="${PRIMARY_CTA}">Book a Call</a>
<a href="/insights" class="${SECONDARY_CTA}">All Resources</a>
</div>
</div>`,
  { divider: false },
)}`,
    }),
  );
}

// ─── Academy ─── Hero (blue) · Narrative · Proof · Connection · Conversion
writePage(
  'academy/index.html',
  shell({
    title: 'TSC Academy — Learn from the Maestros',
    description: 'Structured mentorship programs led by industry veterans.',
    layout: 'academy',
    main: `${academyHero(site.ACADEMY_PAGE.headline, site.ACADEMY_PAGE.subheadline, {
      actions: [
        { href: '#courses', label: 'Explore Courses' },
        { href: '#testimonials', label: 'Testimonials' },
      ],
    })}
${academyBand(
  0,
  `${narrativeCenter('Why TSC Academy', site.ACADEMY_PAGE.whyHeadline, site.ACADEMY_PAGE.whyBody.map((p) => `<p class="text-black/70">${p}</p>`).join(''))}
<div class="grid md:grid-cols-3 gap-4 mt-12 max-w-5xl mx-auto">${[
  ['Mentorship-led', 'Live sessions with practitioners.'],
  ['Artist-first systems', 'Workflows that respect your craft.'],
  ['Community that compounds', 'Peers who push you forward.'],
]
  .map(([t, d]) => proofCard(t, d))
  .join('')}</div>`,
  { id: 'why-academy' },
)}
${academyBand(
  1,
  `${proofHeader('Courses', 'Learn from the Maestros', '')}
<div class="grid md:grid-cols-3 gap-6">${site.ACADEMY_COURSES.map(
  (c) =>
    `<a href="${c.link}" class="block rounded-2xl overflow-hidden border border-teal-dark/10 bg-white hover:border-orange/30 transition-colors"><img src="${c.image}" alt="" class="w-full aspect-video object-cover" loading="lazy" /><div class="p-6"><p class="text-xs text-orange font-alan-sans mb-1">${c.mentor}</p><h3 class="font-signika font-bold text-lg mb-2 text-teal-dark">${c.title}</h3><p class="text-sm text-black/60 font-alan-sans">${c.desc}</p></div></a>`,
).join('')}</div>`,
  { id: 'courses' },
)}
${academyBand(
  2,
  `${proofHeader('Proof', 'Artist Testimonials', '')}
<div class="grid md:grid-cols-3 gap-6">${site.ACADEMY_TESTIMONIALS.map(
  (t) =>
    `<blockquote class="p-6 rounded-2xl border border-teal-dark/10 bg-cream"><img src="${t.image}" alt="${t.name}" class="w-16 h-16 rounded-full object-cover mb-4" loading="lazy" /><p class="text-sm text-black/70 font-alan-sans italic mb-4">"${t.quote}"</p><footer><strong class="font-signika text-teal-dark">${t.name}</strong><p class="text-xs text-orange font-alan-sans">${t.role}</p></footer></blockquote>`,
).join('')}</div>`,
  { id: 'testimonials' },
)}
${conversionBand('Still unsure where to start?', "Let's talk.", { label: 'Book a Call' })}
${pageFooter(site.ACADEMY_PAGE.finalCta.headline, site.ACADEMY_PAGE.finalCta.body)}
${academyBand(
  3,
  `<h2 class="${H2} text-center mb-6">Ready to Begin Your Musical Journey?</h2>
<div class="flex flex-wrap justify-center gap-3">
<a href="#courses" class="${PRIMARY_CTA}">View Courses</a>
<a href="/masterclass/sandesh-shandilya" class="${SECONDARY_CTA}">Masterclass</a>
</div>`,
  { id: 'cta', divider: false },
)}`,
    script: '/src/js/pages/academy.js',
  }),
);

writePage(
  'academy/ambassador/index.html',
  shell({
    title: 'Ambassador Program — TSC Academy',
    description: 'TSC Academy ambassador program for emerging artists.',
    layout: 'academy',
    main: `${marketingHero('Ambassador Program', 'Represent TSC Academy.', 'Community · Leadership · Growth')}
${contentBand(
  0,
  `<div class="${WIDTH.narrative} mx-auto font-alan-sans text-amber-text" data-reveal>
<p class="${BODY} mb-8">Join the TSC Academy ambassador community. Apply through Artist Path or book a call to learn more.</p>
<div class="flex flex-wrap gap-3">
<a href="/artist-path" class="${PRIMARY_CTA}">Artist Path</a>
<a href="/book-a-call" class="${SECONDARY_CTA}">Book a Call</a>
</div>
</div>`,
  { divider: false },
)}`,
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
      main: `${courseHero(course.mentor, course.title, course.desc)}${courseBioGrid(course, bio)}`,
    }),
  );
}

writePage(
  'masterclass/sandesh-shandilya/index.html',
  shell({
    title: 'Sandesh Shandilya Masterclass — TSC Academy',
    description: 'Learn composition from award-winning Bollywood composer Sandesh Shandilya.',
    layout: 'academy',
    main: `${marketingHero('Masterclass', 'Sandesh Shandilya', 'The heART of Composition')}
${contentBand(0, `<div class="text-center"><a href="/courses/composition-comprehensive" class="${PRIMARY_CTA}">View Full Course</a></div>`, { divider: false })}`,
  }),
);

writePage(
  'masterclass/prasad-khaparde/index.html',
  shell({
    title: 'Prasad Khaparde Masterclass — TSC Academy',
    description: 'Hindustani classical mentorship with Pandit Prasad Khaparde.',
    layout: 'academy',
    main: `${marketingHero('Masterclass', 'Pandit Prasad Khaparde', 'Roots of Hindustani Classical')}
${contentBand(0, `<div class="text-center"><a href="/courses/hindustani-classical" class="${PRIMARY_CTA}">View Full Course</a></div>`, { divider: false })}`,
  }),
);

// ─── Forms — single focal card, minimal chrome
const formShell = (title, desc, formId, steps, script) =>
  shell({
    title,
    description: desc,
    layout: 'form',
    main: `<section class="relative bg-cream pt-28 pb-16 px-4 min-h-screen">
<div class="max-w-xl mx-auto">
<div id="form-root" data-form="${formId}" data-steps="${steps}"></div>
</div>
</section>`,
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

// ─── Artist profiles — canonical blueprint (harshadduhita uses editorial reference layout)
for (const artist of roster.ROSTER_ARTISTS) {
  if (artist.slug === 'harshadduhita') {
    writePage(
      `${artist.slug}/index.html`,
      shell({
        title: `${artist.name} | TSC`,
        description: artist.tagline,
        layout: 'marketing',
        mainClass: 'harshad-page min-h-screen',
        main: renderHarshadduhitaPage(artist),
        script: '/src/js/pages/harshadduhita.js',
      }),
    );
    continue;
  }
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

// ─── Link-in-bio — Hero + Conversion only
writePage(
  'links/harshad-and-duhita/index.html',
  shell({
    title: 'Harshaduhita — Links',
    description: 'Quick links for Harshad & Duhita',
    main: `${marketingHero('Harshaduhita', 'Harshad & Duhita', 'Contemporary classical duo — bookings, music, and full TSC profile.')}
${contentBand(
  0,
  `<div class="flex flex-wrap justify-center gap-3">
<a href="/harshadduhita" class="${PRIMARY_CTA}">Full profile</a>
<a href="/query?artist=harshadduhita" class="${SECONDARY_CTA}">Book online</a>
</div>`,
  { divider: false },
)}`,
  }),
);

writePage(
  'links/yugm/index.html',
  shell({
    title: 'Yugm — Links',
    description: 'Quick links for Yugm',
    main: `${marketingHero('Yugm', 'Yugm', 'Jaipur folk fusion — stream, collaborate, or book through TSC.')}
${contentBand(
  0,
  `<div class="flex flex-wrap justify-center gap-3">
<a href="/yugm" class="${PRIMARY_CTA}">Full profile</a>
<a href="/query?artist=yugm" class="${SECONDARY_CTA}">Book online</a>
</div>`,
  { divider: false },
)}`,
  }),
);

// Review forms — isolated layout
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

console.log('Generated marketing pages');
console.log('Generated all static pages');
