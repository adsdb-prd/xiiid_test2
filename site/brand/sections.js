/*!
 * sections.js — XIIID page furniture for the local site.
 *
 * The bundled Vue app only knows how to render the CMS section types it shipped
 * with, so everything XIIID-specific that has no CMS equivalent is built here:
 * the anchor nav, the project modals, and the Ecosystem / Partners / Team /
 * News / Apps / Community sections, plus the rebuilt footer.
 *
 * It runs after the app mounts and appends into the existing layout, so the
 * original header, story sections and 3D background keep working untouched.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Content
   * ------------------------------------------------------------------ */

  var NAV = [
    { label: 'Projects', href: '#projects' },
    { label: 'Ecosystem', href: '#ecosystem' },
    { label: 'Team', href: '#team' },
    { label: 'News', href: '#news' },
    { label: 'App', href: '#apps' }
  ];

  var XCLASS_URL = 'https://xclass.xiiid.ai/';
  var STUDIO_URL = 'https://xpredict-dev.web.app/sign-in';
  var XPREDICT_URL = 'https://xpredict-dev.web.app/';
  var PAPER_URL = 'https://xiiid.gitbook.io/xiiid';

  /* AI Tutor ships two ways: one built per institution, one open to anyone. */
  var TRACKS = {
    pro: {
      name: 'AI Pro',
      kicker: 'For institutions · B2B & B2G',
      text: 'An agentic tutor that belongs to one place. It learns that country’s language, its curriculum and its exams, then teaches as if it had always been there.'
    },
    cls: {
      name: 'AI Class',
      kicker: 'For everyone · B2C',
      text: 'The same tutor, open to anyone. It reads how you answer and rebuilds the next question around you. Study long enough and no one else’s looks like yours. Live today as XClass.'
    }
  };

  var STUDIO = {
    title: 'AI Studio builds it.',
    text: 'Give it a curriculum, a language and a question bank. It hands back an agentic tutor you can shape, retrain and put in front of a class — changed by the people who run the programme, not by engineers.',
    cta: { text: 'Open XPredict', href: XPREDICT_URL }
  };

  var DEPLOYMENTS = [
    {
      place: 'Samsung', product: 'OPicUP', kind: 'B2B · Korea', state: 'Live',
      mark: '/brand/partners/wall/samsung.png', markKind: 'logo',
      text: 'Language assessment practice, delivered through a partnership with Samsung.'
    },
    {
      place: 'Colombia', product: 'EOSaber', kind: 'B2G · Public schools', state: 'Live',
      mark: '/brand/modal/flag-co.png', markKind: 'flag',
      text: 'Saber exam preparation, running inside the country’s public education system.'
    },
    {
      place: 'Paraguay', product: 'National rollout', kind: 'B2G · Public schools', state: 'In progress',
      mark: '/brand/modal/flag-py.png', markKind: 'flag',
      text: 'In agreement with the government, preparing to reach public classrooms nationwide.'
    }
  ];

  var ECOSYSTEM = [
    {
      n: '1', title: 'Study on XClass',
      text: 'Open AI Tutor inside XClass to master lessons, practice skills, and track progress.',
      note: 'Free for everyone'
    },
    {
      n: '2', title: 'Earn XPoints',
      text: 'Every completed lesson, daily streak, and milestone earns XPoints. A direct proof of effort, not spending.',
      note: 'Earned naturally'
    },
    {
      n: '3', title: 'Convert in XWallet',
      text: 'Move XPoints directly into XWallet to manage, hold, or convert your proof of work.',
      note: 'Unified experience'
    },
    {
      n: '4', title: 'Hold XIIID',
      text: 'Turn effort into ownership. XIIID gives you a genuine, on-chain stake in the platform you use.',
      note: 'Secured on-chain'
    }
  ];

  var PARTNER_ROLES = [
    { role: 'Tech partner', name: 'XIDSOFT', logo: '/brand/partners/xidsoft.png' },
    { role: 'Infrastructure partner', name: 'Fog Hashing', logo: '/brand/partners/foghashing.png' },
    { role: 'Security partner', name: 'Beosin', logo: '/brand/partners/beosin.png' }
  ];

  var PARTNER_NOTE =
    'Deep Tech Partner with XIIID Labs. XIDSOFT is an AI-driven BaaS Corp. established in the U.S. in ' +
    '2022, following its acquisition of DixSoft, a deep-tech firm that provided AI and blockchain core ' +
    'technologies to industry leaders such as Samsung, Hyundai Motor, KT, Shopify, and Mercedes-Benz.';

  // Two marquee rows, drifting in opposite directions.
  var WALL_A = [
    'samsung.png', 'samsung-sds.png', 'samsung-sdi.png', 'samsung-display.png', 'samsung-card.png',
    'hyundai.png', 'hyundai-heavy.png', 'kt.png', 'sk.png', 'shopify.png', 'dupont.png',
    'hanwha-total.svg', 'korea-gas.png', 'korea-expressway.svg', 'keri-kr.png', 'seoul.png', 'yonsei.png'
  ];
  var WALL_B = [
    'idb.png', 'ande.png', 'renova.png', 'avikus.png', 'phantom-ai.png', 'roboticslab.png',
    '3dtada.png', 'kyungshin.png', 'pulmuone.png', 'mail.png', 'ybm.png', 'carrot-global.png',
    'cg-education.png', 'jyp.png', 'yuanta.png', 'eagle.png', 'theplan-g.png'
  ];

  var TEAM = [
    {
      name: 'Scott Kim', role: 'Founder and CEO', photo: '/brand/team/scott.png',
      text: "Scott has led XIIID from the start. Formerly Chief Governance Officer at Riiid, he spearheaded the company's global expansion."
    },
    {
      name: 'Vu D. Christopher', role: 'Co-founder and CTO', photo: '/brand/team/vu.png',
      text: 'MIT Computer Science graduate and former technical lead at Riiid, where he led AI-driven global initiatives.'
    }
  ];

  var NEWS = [
    {
      title: "XIIID Brings AI Tutor to Paraguay's Public Schools",
      date: '2026.09', thumb: '/brand/news/news-1.jpg',
      href: 'https://www.openpr.com/news/4625524/xiiid-brings-ai-tutor-to-paraguay-s-public-schools'
    },
    {
      title: 'XIIID Strengthens Partnership with Paraguay to Drive AI-Powered Education Reform',
      date: '2025.11', thumb: '/brand/news/news-2.jpg',
      href: 'https://medium.com/@xiiid/xiiid-strengthens-partnership-with-paraguay-to-drive-ai-powered-education-reform-2a76f76e0828'
    },
    {
      title: 'XIIID Successfully Concludes BLAD Conference 2025 in the U.S., Accelerating Global Web3 Expansion',
      date: '2025.07', thumb: '/brand/news/news-3.jpg',
      href: 'https://medium.com/@xiiid/xiiid-successfully-concludes-blad-conference-2025-in-the-u-s-accelerating-global-web3-expansion-320aeefcb031'
    }
  ];

  var APPS = [
    {
      name: 'XClass',
      text: 'Tutoring, lessons, assessment, and progress. Everything inside one effortless app.',
      play: 'https://play.google.com/store/apps/details?id=io.blad.xiiid.aos',
      ios: 'https://apps.apple.com/kr/app/xclass-by-xiiid/id6777957719'
    },
    {
      name: 'XWallet',
      text: 'The official wallet for XIIID. Seamlessly hold, convert, and manage your earnings directly from XClass.',
      play: 'https://play.google.com/store/apps/details?id=io.blad.xwallet',
      ios: 'https://apps.apple.com/kr/app/xwallet-by-xiiid/id6785023022'
    },
    {
      name: 'XPredict',
      text: 'AI Studio in a browser. Build, tune and ship an agentic tutor of your own, then hand it to a classroom.',
      web: XPREDICT_URL
    }
  ];

  var COMMUNITY = [
    { label: 'X', href: 'https://x.com/Xiiid_official', icon: '/brand/sns/x.png' },
    { label: 'Telegram', href: 'https://t.me/XIIID_Channel', icon: '/brand/sns/telegram.png' },
    { label: 'GitHub', href: 'https://github.com/Xiiid', icon: '/brand/sns/github.png' },
    { label: 'CoinGecko', href: 'https://www.coingecko.com/en/coins/xiiid', icon: '/brand/sns/coingecko.svg' },
    { label: 'Medium', href: 'https://medium.com/@xiiid', icon: '/brand/sns/medium.png' },
    { label: 'Token', href: '#token' },
    { label: 'KYC', href: 'https://xiiidlabs.imweb.me/kyc' },
    { label: 'White Paper', href: PAPER_URL }
  ];

  var FOOTER_COLUMNS = [
    {
      title: 'Resources', links: [
        { text: 'Whitepaper', link: PAPER_URL },
        { text: 'XClass', link: XCLASS_URL },
        { text: 'Download the apps', link: '#apps' }
      ]
    }
  ];

  var TOKEN_MINT = 'AtNfXEt9vSZtHovxVYKXrfFwATfddmeMvApugZzcdWiQ';

  /* Project modals — the long-form version of the three project cards. */
  var MODALS = {
    'token': {
      eyebrow: 'XIIID Token', title: 'Tokenomics',
      lead: 'The token behind the loop: earned by studying, held on Solana, verifiable by anyone.',
      table: [
        { k: 'Token Name', v: 'XIIID' },
        { k: 'Symbol', v: 'XIIID' },
        { k: 'Network', v: 'SOLANA' },
        { k: 'Token Standard', v: 'SPL Token' },
        { k: 'Mint Address', v: TOKEN_MINT, wrap: true },
        { k: 'Decimals', v: '9' },
        { k: 'Total Supply', v: '10,000,000,000 XIIID' }
      ],
      links: [
        { text: 'Official Website', href: 'https://xiiid.ai' },
        { text: 'GitBook', href: 'https://xiiid.gitbook.io/xiiid' },
        { text: 'Metadata URI', href: 'https://xclass.xiiid.ai/token/metadata.json' },
        { text: 'Token Image', href: 'https://xclass.xiiid.ai/token/xiiid.png' },
        { text: 'Solscan', href: 'https://solscan.io/token/' + TOKEN_MINT }
      ]
    },
    'project-ai-tutor': {
      eyebrow: '01', title: 'AI Tutor', orb: '/brand/modal/orb-tutor.gif',
      hero: '/brand/modal/ai-tutor.jpg',
      lead: 'AI tutors enabling curated learning, motivation, and dynamic discussions are powering education across 20 countries, including Korea and Colombia.',
      exams: [
        { flag: '/brand/modal/flag-br.png', name: 'ENEM', size: '3.4M' },
        { flag: '/brand/modal/flag-co.png', name: 'Saber11', size: '0.6M' },
        { flag: '/brand/modal/flag-ae.png', name: 'UAE EMSAT', size: '0.3M' },
        { flag: '/brand/modal/flag-kr.png', name: 'KSAT', size: '0.6M' },
        { flag: '/brand/modal/flag-cn.png', name: 'GAOKAO', size: '18M' },
        { flag: '/brand/modal/flag-us.png', name: 'SAT/ACT', size: '3.4M' }
      ],
      tests: [
        { src: '/brand/modal/test-toeic.png', alt: 'TOEIC' },
        { src: '/brand/modal/test-toeic-sw.png', alt: 'TOEIC Speaking and Writing' },
        { src: '/brand/modal/test-opic.png', alt: 'OPIc' },
        { src: '/brand/modal/test-ielts.png', alt: 'IELTS' },
        { src: '/brand/modal/test-toefl.png', alt: 'TOEFL' },
        { src: '/brand/modal/test-sat.png', alt: 'SAT' }
      ],

      footnote: "XIIID's AI Tutor is poised to disrupt the $300B global test-prep market, seamlessly integrating across TOEIC, TOEFL, SAT, national college entrance exams, and any standardized test worldwide."
    },
    'project-ai-studio': {
      eyebrow: '02', title: 'AI Studio', orb: '/brand/modal/orb-studio.gif',
      hero: '/brand/modal/ai-studio.jpg',
      lead: 'XIIID AI Studio is an all-in-one powerhouse, integrating modular systems and deep-learning AI for seamless development.',
      tail: { src: '/brand/modal/ai-studio-dash.jpg', caption: 'Model training and performance dashboard' },
      footnote: 'XIIID AI STUDIO is a groundbreaking AIaaS solution, empowering anyone to create AI Tutors easily and efficiently — unlocking the future of AI-driven education.',
      cta: { text: 'Try it now', href: STUDIO_URL }
    },
    'project-blockchain': {
      eyebrow: '03', title: 'Why Blockchain?', orb: '/brand/modal/orb-chain.gif',
      hero: '/brand/modal/blockchain.jpg',
      kicker: 'Powering a Smarter AI Ecosystem',
      lead: 'XIIID is building a decentralized AI network where creators, educators, and innovators shape the future of AI tutors — together.',
      wide: { src: '/brand/modal/tokenomics.jpg', caption: 'Tokenomics: how value moves through the network' },

      footnote: 'XIIID builds a decentralized tokenomics system where AI Tutors generate revenue issued as NFT-backed smart contracts — seamlessly distributing value to contributors and investors.'
    }
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function extLink(href, cls, label, children) {
    var kids = children || [];
    if (label) kids = kids.concat([el('span', { text: label })]);
    return el('a', {
      href: href, class: cls, target: '_blank', rel: 'noopener noreferrer', 'data-external': '1'
    }, kids);
  }

  function img(src, cls, alt) {
    return el('img', { src: src, class: cls, alt: alt == null ? '' : alt, loading: 'lazy' });
  }

  function figure(src, caption, cls) {
    return el('figure', { class: 'x-figure ' + (cls || '') }, [
      el('div', { class: 'x-figure-frame' }, [img(src, null, '')]),
      caption ? el('figcaption', { text: caption }) : null
    ]);
  }

  /* The page runs a smooth-scroll library of its own; asking the browser for
     `behavior: smooth` on top of it leaves the two fighting and the page never
     settles, so hand the library a target and fall back to a plain jump. */
  function lenis() {
    return window.lenis || window.__lenis || (window.$nuxt && window.$nuxt.$lenis) || null;
  }

  function scrollToY(y) {
    var l = lenis();
    if (l && typeof l.scrollTo === 'function') { l.scrollTo(y); return; }
    window.scrollTo(0, y);
  }

  function scrollToId(id) {
    if (id === 'top') { scrollToY(0); return true; }
    var target = document.getElementById(id);
    if (!target) return false;
    var header = document.querySelector('.header-main');
    var offset = header ? Math.min(header.offsetHeight * 0.45, 90) : 24;
    scrollToY(Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset));
    return true;
  }

  /* ------------------------------------------------------------------ *
   * Header: anchor nav, XClass button, logo-to-top
   * ------------------------------------------------------------------ */

  function buildNav(header) {
    var inner = header.querySelector('.header-inner');
    if (!inner) return;
    header.classList.add('x-header');

    var list = el('ul', { class: 'x-nav-list' }, NAV.map(function (item) {
      return el('li', null, [el('a', { class: 'x-nav-link', href: item.href, text: item.label })]);
    }));

    var cta = el('a', {
      class: 'x-nav-cta', href: XCLASS_URL, target: '_blank',
      rel: 'noopener noreferrer', text: 'XClass', 'data-external': '1'
    });

    var toggle = el('button', {
      class: 'x-nav-toggle', type: 'button', 'aria-label': 'Open navigation', 'aria-expanded': 'false',
      html: '<span></span><span></span>'
    });

    inner.appendChild(el('nav', { class: 'x-nav', 'aria-label': 'Main' }, [list, cta, toggle]));

    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('x-nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

  function wireLogo(header) {
    var logo = header.querySelector('.header-logo');
    if (!logo || logo.dataset.xTop === '1') return;
    logo.dataset.xTop = '1';
    logo.setAttribute('role', 'link');
    logo.setAttribute('tabindex', '0');
    logo.setAttribute('aria-label', 'XIIID AI Labs — back to top');
    logo.addEventListener('click', function () { scrollToY(0); });
    logo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToY(0); }
    });
  }

  /* ------------------------------------------------------------------ *
   * Sections
   * ------------------------------------------------------------------ */

  function sectionHead(title, text) {
    return el('div', { class: 'x-head' }, [
      el('h2', { class: 'x-title', text: title }),
      text ? el('p', { class: 'x-lead', text: text }) : null
    ]);
  }

  function trackHead(t) {
    return [
      el('h4', { class: 'x-track-name', text: t.name }),
      el('p', { class: 'x-track-kicker', text: t.kicker }),
      el('p', { class: 'x-track-text', text: t.text })
    ];
  }

  function ecosystemSection() {
    /* Left column: who AI Pro is for, where it already runs, what builds it. */
    var field = el('ul', { class: 'x-field' }, DEPLOYMENTS.map(function (d) {
      return el('li', { class: 'x-field-row' }, [
        el('span', { class: 'x-field-mark x-field-mark-' + d.markKind }, [img(d.mark, null, d.place)]),
        el('div', { class: 'x-field-body' }, [
          el('div', { class: 'x-field-top' }, [
            el('h6', { class: 'x-field-place', text: d.place }),
            el('span', { class: 'x-field-product', text: d.product }),
            el('span', {
              class: 'x-field-state' + (d.state === 'Live' ? ' is-live' : ''),
              text: d.state
            })
          ]),
          el('p', { class: 'x-field-text', text: d.text }),
          el('p', { class: 'x-field-kind', text: d.kind })
        ])
      ]);
    }));

    var proCol = el('div', { class: 'x-map-col x-map-pro' }, trackHead(TRACKS.pro).concat([
      el('h5', { class: 'x-map-sub', text: 'AI Pro in the field' }),
      field,
      el('h5', { class: 'x-map-sub', text: STUDIO.title }),
      el('p', { class: 'x-map-text', text: STUDIO.text }),
      el('div', { class: 'x-map-cta-row' }, [extLink(STUDIO.cta.href, 'x-studio-cta', STUDIO.cta.text)])
    ]));

    /* Right column: who AI Class is for, and the loop it runs on. */
    var steps = el('div', { class: 'x-eco-steps' }, ECOSYSTEM.map(function (s) {
      return el('article', { class: 'x-eco-card' }, [
        el('div', { class: 'x-eco-card-top' }, [
          el('span', { class: 'x-eco-num', text: s.n }),
          el('h3', { text: s.title })
        ]),
        el('p', { class: 'x-eco-text', text: s.text }),
        el('p', { class: 'x-eco-note', text: s.note })
      ]);
    }));

    var clsCol = el('div', { class: 'x-map-col x-map-class' }, trackHead(TRACKS.cls).concat([
      el('h5', { class: 'x-map-sub', text: 'Study. Earn. Convert. Own.' }),
      steps,
      el('p', { class: 'x-eco-chain', text: 'Blockchain' }),
      el('p', { class: 'x-eco-caption', text: 'Ownership is a reason to come back.' })
    ]));

    return el('section', { class: 'x-section x-ecosystem', id: 'ecosystem' }, [
      el('div', { class: 'x-veil', 'aria-hidden': 'true' }),
      el('div', { class: 'x-inner' }, [
        el('div', { class: 'x-head x-head-eco' }, [
          el('h2', { class: 'x-title' }, [
            el('span', { class: 'x-underline', text: 'Ecosystem.' })
          ]),
          el('p', { class: 'x-lead', text: 'Do the work. Own the result.' })
        ]),
        el('div', { class: 'x-map' }, [
          el('h3', { class: 'x-map-title', text: 'AI Tutor' }),
          el('div', { class: 'x-map-cols' }, [proCol, clsCol])
        ])
      ])
    ]);
  }

  function marqueeRow(files, dir) {
    function run() {
      return el('div', { class: 'x-marquee-run' }, files.map(function (f) {
        return el('div', { class: 'x-marquee-item' }, [img('/brand/partners/wall/' + f, null, '')]);
      }));
    }
    return el('div', { class: 'x-marquee x-marquee-' + dir }, [
      el('div', { class: 'x-marquee-track' }, [run(), run()])
    ]);
  }

  function partnersSection() {
    var roles = el('div', { class: 'x-partner-roles' }, PARTNER_ROLES.map(function (p) {
      return el('div', { class: 'x-partner-role' }, [
        el('p', { class: 'x-partner-role-label', text: p.role }),
        el('div', { class: 'x-partner-logo' }, [img(p.logo, null, p.name)])
      ]);
    }));

    return el('section', { class: 'x-section x-partners', id: 'partners' }, [
      el('div', { class: 'x-inner' }, [
        sectionHead('Built with people who ship at scale.', null),
        roles,
        el('p', { class: 'x-partner-note', text: PARTNER_NOTE })
      ]),
      el('div', { class: 'x-marquee-wrap' }, [
        el('p', { class: 'x-partner-wall-label', text: 'Technology delivered to' }),
        marqueeRow(WALL_A, 'left'),
        marqueeRow(WALL_B, 'right')
      ])
    ]);
  }

  function teamSection() {
    var people = el('div', { class: 'x-team-grid' }, TEAM.map(function (m) {
      return el('article', { class: 'x-team-card' }, [
        el('div', { class: 'x-team-photo' }, [img(m.photo, null, m.name)]),
        el('div', { class: 'x-team-body' }, [
          el('h3', { class: 'x-team-name', text: m.name }),
          el('p', { class: 'x-team-role', text: m.role }),
          el('p', { class: 'x-team-text', text: m.text })
        ])
      ]);
    }));
    return el('section', { class: 'x-section x-team', id: 'team' }, [
      el('div', { class: 'x-inner' }, [sectionHead('Built by proven builders.', null), people])
    ]);
  }

  function newsSection() {
    var items = el('div', { class: 'x-news-grid' }, NEWS.map(function (a) {
      return el('a', {
        class: 'x-news-card', href: a.href, target: '_blank',
        rel: 'noopener noreferrer', 'data-external': '1'
      }, [
        el('div', { class: 'x-news-thumb' }, [img(a.thumb, null, '')]),
        el('div', { class: 'x-news-body' }, [
          el('p', { class: 'x-news-meta', text: a.date }),
          el('h3', { class: 'x-news-title', text: a.title }),
          el('span', { class: 'x-news-more', text: 'Read the story ↗' })
        ])
      ]);
    }));
    return el('section', { class: 'x-section x-news', id: 'news' }, [
      el('div', { class: 'x-inner' }, [sectionHead('What we shipped, where it landed.', null), items])
    ]);
  }

  var STORE_LABEL = { ios: 'App Store', play: 'Google Play', web: 'Open on the web' };
  function storeButton(href, store) {
    return extLink(href, 'x-store x-store-' + store, STORE_LABEL[store] || 'Open');
  }

  function appsSection() {
    var cards = el('div', { class: 'x-apps-grid' }, APPS.map(function (a) {
      var buttons = a.web
        ? [storeButton(a.web, 'web')]
        : [storeButton(a.ios, 'ios'), storeButton(a.play, 'play')];
      return el('article', { class: 'x-app-card' }, [
        el('div', { class: 'x-app-mark', 'aria-hidden': 'true' }),
        el('h3', { class: 'x-app-name', text: a.name }),
        el('p', { class: 'x-app-text', text: a.text }),
        el('div', { class: 'x-app-stores' }, buttons)
      ]);
    }));
    return el('section', { class: 'x-section x-apps', id: 'apps' }, [
      el('div', { class: 'x-inner' }, [sectionHead('The classroom, in your pocket.', null), cards])
    ]);
  }

  function communitySection() {
    var links = el('div', { class: 'x-community-links' }, COMMUNITY.map(function (c) {
      // the icon buttons carry no visible label, so the name moves to the
      // accessible name and the tooltip
      if (c.icon) {
        var iconLink = extLink(c.href, 'x-community-link x-community-link-icon', null, [
          el('span', { class: 'x-community-icon' }, [img(c.icon, null, '')])
        ]);
        iconLink.setAttribute('aria-label', c.label);
        iconLink.setAttribute('title', c.label);
        return iconLink;
      }
      if (c.href.charAt(0) === '#') {
        return el('a', { href: c.href, class: 'x-community-link x-community-link-text' }, [
          el('span', { text: c.label })
        ]);
      }
      return extLink(c.href, 'x-community-link x-community-link-text', c.label);
    }));
    return el('section', { class: 'x-section x-community', id: 'community' }, [
      el('div', { class: 'x-inner' }, [sectionHead('Follow the work into the classroom.', null), links])
    ]);
  }

  /* ------------------------------------------------------------------ *
   * Project modals
   * ------------------------------------------------------------------ */

  function modalBody(d) {
    var body = el('div', { class: 'x-modal-body' });

    body.appendChild(el('div', { class: 'x-modal-top' }, [
      el('div', { class: 'x-modal-head' }, [
        d.orb ? el('div', { class: 'x-modal-orb' }, [img(d.orb, null, '')]) : null,
        el('p', { class: 'x-modal-eyebrow', text: d.eyebrow }),
        el('h2', { class: 'x-modal-title', text: d.title }),
        d.kicker ? el('p', { class: 'x-modal-kicker', text: d.kicker }) : null,
        el('p', { class: 'x-modal-lead', text: d.lead })
      ]),
      d.hero ? el('div', { class: 'x-modal-hero' }, [img(d.hero, null, '')]) : null
    ]));

    if (d.exams) {
      body.appendChild(el('div', { class: 'x-modal-grid x-modal-exams' }, d.exams.map(function (e) {
        return el('div', { class: 'x-tile' }, [
          el('span', { class: 'x-tile-flag' }, [img(e.flag, null, '')]),
          el('span', { class: 'x-tile-name', text: e.name }),
          el('span', { class: 'x-tile-size', text: e.size })
        ]);
      })));
    }
    if (d.tests) {
      body.appendChild(el('div', { class: 'x-modal-grid x-modal-tests' }, d.tests.map(function (t) {
        return el('div', { class: 'x-tile x-tile-test' }, [img(t.src, null, t.alt)]);
      })));
    }
    if (d.wide) body.appendChild(figure(d.wide.src, d.wide.caption, 'x-figure-wide'));
    if (d.metrics) {
      body.appendChild(el('div', { class: 'x-modal-grid x-modal-metrics' }, d.metrics.map(function (m) {
        return el('div', { class: 'x-tile x-tile-metric' }, [
          el('span', { class: 'x-tile-k', text: m.k }),
          el('span', { class: 'x-tile-v', text: m.v })
        ]);
      })));
    }
    if (d.index) {
      body.appendChild(el('div', { class: 'x-modal-index' }, [
        el('p', { class: 'x-modal-subhead', text: 'Current model performance' }),
        el('div', { class: 'x-modal-grid x-modal-metrics' }, d.index.map(function (m) {
          return el('div', { class: 'x-tile x-tile-metric x-tile-accent' }, [
            el('span', { class: 'x-tile-k', text: m.k }),
            el('span', { class: 'x-tile-v', text: m.v })
          ]);
        }))
      ]));
    }
    if (d.gallery) {
      body.appendChild(el('div', { class: 'x-modal-gallery' }, d.gallery.map(function (g) {
        return figure(g.src, g.caption, g.plate ? 'x-figure-plate' : '');
      })));
    }
    if (d.cta) {
      body.appendChild(el('div', { class: 'x-modal-cta-row' }, [extLink(d.cta.href, 'x-modal-cta', d.cta.text)]));
    }
    if (d.tail) body.appendChild(figure(d.tail.src, d.tail.caption, 'x-figure-wide x-figure-tail'));
    if (d.table) {
      body.appendChild(el('dl', { class: 'x-spec' }, d.table.reduce(function (rows, r) {
        return rows.concat([
          el('dt', { class: 'x-spec-k', text: r.k }),
          el('dd', { class: 'x-spec-v' + (r.wrap ? ' x-spec-wrap' : ''), text: r.v })
        ]);
      }, [])));
    }
    if (d.links) {
      body.appendChild(el('div', { class: 'x-modal-links' }, d.links.map(function (l) {
        return extLink(l.href, 'x-modal-link', l.text);
      })));
    }
    if (d.footnote) body.appendChild(el('p', { class: 'x-modal-foot', text: d.footnote }));
    return body;
  }

  var openModalId = null;
  var lastFocus = null;

  function buildModals(host) {
    Object.keys(MODALS).forEach(function (id) {
      var d = MODALS[id];
      var close = el('button', { class: 'x-modal-close', type: 'button', 'aria-label': 'Close', text: '✕' });
      var dialog = el('div', {
        class: 'x-modal-dialog', role: 'dialog', 'aria-modal': 'true',
        'aria-label': d.title, tabindex: '-1'
      }, [close, modalBody(d)]);
      var overlay = el('div', { class: 'x-modal', id: 'modal-' + id, hidden: '' }, [dialog]);
      close.addEventListener('click', closeModal);
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeModal(); });
      host.appendChild(overlay);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openModalId) closeModal();
    });
  }

  function openModal(id) {
    var overlay = document.getElementById('modal-' + id);
    if (!overlay) return false;
    lastFocus = document.activeElement;
    openModalId = id;
    overlay.hidden = false;
    document.documentElement.classList.add('x-modal-lock');
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      var dlg = overlay.querySelector('.x-modal-dialog');
      if (dlg) { dlg.scrollTop = 0; dlg.focus(); }
    });
    return true;
  }

  function closeModal() {
    if (!openModalId) return;
    var overlay = document.getElementById('modal-' + openModalId);
    openModalId = null;
    document.documentElement.classList.remove('x-modal-lock');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    window.setTimeout(function () { overlay.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------------ *
   * Footer
   * ------------------------------------------------------------------ */

  function buildFooter(footer) {
    var inner = footer.querySelector('.footer-inner');
    if (!inner) return;
    footer.classList.add('x-footer');
    inner.innerHTML = '';

    // A muted loop behind a dark scrim, fading in from the top.
    var video = el('video', {
      class: 'x-footer-video', src: '/brand/media/footer.mp4',
      poster: '/brand/media/footer-poster.jpg',
      autoplay: '', muted: '', loop: '', playsinline: '',
      'aria-hidden': 'true', preload: 'auto'
    });
    video.muted = true;
    video.setAttribute('webkit-playsinline', '');
    var tryPlay = function () { var r = video.play(); if (r && r.catch) r.catch(function () {}); };
    tryPlay();
    // Some browsers refuse autoplay until the element is on screen or the
    // visitor has interacted; retry on both, and keep the poster meanwhile.
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) tryPlay(); });
      }, { threshold: 0.05 }).observe(video);
    }
    document.addEventListener('pointerdown', tryPlay, { once: true });
    if (!footer.querySelector('.x-footer-media')) {
      footer.insertBefore(el('div', { class: 'x-footer-media', 'aria-hidden': 'true' }, [
        video, el('div', { class: 'x-footer-scrim' })
      ]), footer.firstChild);
    }

    var columns = el('div', { class: 'x-footer-columns' }, FOOTER_COLUMNS.map(function (c) {
      var items = (c.lines || []).map(function (t) { return el('li', { class: 'x-footer-line', text: t }); });
      (c.links || []).forEach(function (l) {
        var isHash = l.link.charAt(0) === '#';
        var isMail = l.link.indexOf('mailto:') === 0;
        items.push(el('li', { class: 'x-footer-item' }, [
          isHash || isMail
            ? el('a', { href: l.link, text: l.text })
            : extLink(l.link, '', l.text)
        ]));
      });
      return el('div', { class: 'x-footer-col' }, [
        el('p', { class: 'x-footer-col-title', text: c.title }),
        el('ul', { class: 'x-footer-list' }, items)
      ]);
    }));

    inner.appendChild(el('div', { class: 'x-footer-grid' }, [
      el('div', { class: 'x-footer-brand' }, [
        el('div', { class: 'x-footer-mark', 'aria-hidden': 'true' }),
        el('p', { class: 'x-footer-tagline', text: 'Education without borders.' }),
        el('a', {
          class: 'x-footer-cta', href: XCLASS_URL, target: '_blank',
          rel: 'noopener noreferrer', text: 'Open XClass ↗', 'data-external': '1'
        })
      ]),
      columns
    ]));
    inner.appendChild(el('div', { class: 'x-footer-bar' }, [
      el('p', { class: 'x-footer-copy', text: '© 2026 XIIID ALL RIGHTS RESERVED' })
    ]));
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */

  function markAnchors() {
    var projects = document.querySelector('.section-logoCards');
    if (projects && !projects.id) projects.id = 'projects';
    var panels = document.querySelectorAll('.section-text-card-side');
    if (panels.length && !panels[0].id) panels[0].id = 'mission';
  }

  function build() {
    var page = document.querySelector('.page-home');
    var experience = document.querySelector('.rubiks-experience');
    if (!page || !experience) return false;
    var built = false;

    if (!page.querySelector('.x-sections')) {
      markAnchors();
      page.appendChild(el('div', { class: 'x-sections' }, [
        ecosystemSection(), partnersSection(), teamSection(),
        newsSection(), appsSection(), communitySection()
      ]));
      built = true;
    }
    if (!document.getElementById('modal-project-ai-tutor')) { buildModals(document.body); built = true; }

    var header = document.querySelector('.header-main');
    if (header) {
      if (!header.querySelector('.x-nav')) { buildNav(header); built = true; }
      wireLogo(header);
    }
    var footer = document.querySelector('.footer-main');
    if (footer && !footer.querySelector('.x-footer-grid')) { buildFooter(footer); built = true; }
    enhanceRequestedElements();
    return built;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    // this listener runs in the capture phase and stops propagation, so the
    // mobile menu has to be closed from here rather than by its own handler
    var header = document.querySelector('.header-main');
    if (header && header.classList.contains('x-nav-open')) {
      header.classList.remove('x-nav-open');
      var t = header.querySelector('.x-nav-toggle');
      if (t) { t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-label', 'Open navigation'); }
    }
    if (MODALS[id]) { e.preventDefault(); e.stopPropagation(); openModal(id); return; }
    if (scrollToId(id)) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // The app re-renders #__nuxt after it mounts, throwing away whatever was in
  // the server markup, so keep watching and re-attach whenever it is missing.

  /* Scroll motion: elements drift up into place the first time they scroll
     into view. The class is only ever added, so a re-render by the app just
     means the fresh nodes get picked up on the next pass. */
  var revealObserver;
  var REVEAL_TARGETS = [
    '.section-logoCards-card', '.x-head', '.x-eco-card', '.x-partner-role',
    '.x-partner-note', '.x-marquee-wrap', '.x-team-card', '.x-news-card',
    '.x-app-card', '.x-community-links', '.x-footer-grid', '.x-footer-bar',
    'main h1', 'main h2', 'main p'
  ].join(', ');

  function reveal(node) { node.classList.add('x-revealed'); }

  function enhanceRequestedElements() {
    if (!window.IntersectionObserver) return;
    // phones get the page as it is: no drift-in on scroll
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (matchMedia('(max-width: 767px)').matches) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    }
    document.querySelectorAll(REVEAL_TARGETS).forEach(function (node) {
      if (node.classList.contains('x-reveal') || node.closest('.x-reveal')) return;
      node.classList.add('x-reveal');
      revealObserver.observe(node);
    });
  }

  // Safety net: nothing stays hidden if an observer callback never arrives.
  window.setTimeout(function () {
    document.querySelectorAll('.x-reveal:not(.x-revealed)').forEach(function (node) {
      if (node.getBoundingClientRect().top < window.innerHeight) reveal(node);
    });
  }, 2500);

  var pending = 0;
  function ensure() {
    if (pending) return;
    pending = requestAnimationFrame(function () { pending = 0; build(); });
  }

  function boot() {
    build();
    var root = document.getElementById('__nuxt') || document.body;
    if (window.MutationObserver) new MutationObserver(ensure).observe(root, { childList: true, subtree: true });
    var tries = 0;
    var timer = window.setInterval(function () {
      build();
      if (++tries > 100) window.clearInterval(timer);
    }, 150);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
