const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Batches scroll/resize work into one update per frame.
const onFrame = (fn) => {
  let pending = false;
  const run = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      fn();
    });
  };
  window.addEventListener('scroll', run, { passive: true });
  window.addEventListener('resize', run);
  fn();
};

// ---------- Mobile menu ----------
const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');

const setMenu = (open) => {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.hidden = !open;
};
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !mobileMenu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});

// ---------- Header turns cream after you start scrolling; hero fades away ----------
// Styles are written straight onto the element (not via a CSS variable) so only
// this element recalculates, not every word inside it.
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroBody = document.querySelector('.hero-body');
let lastHeroP = -1;
onFrame(() => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  if (reduceMotion) return;
  // 0 at the top, 1 once the hero has mostly scrolled away.
  const p = Math.min(Math.max(y / (hero.offsetHeight * 0.75), 0), 1);
  if (Math.abs(p - lastHeroP) < 0.001) return;
  lastHeroP = p;
  heroBody.style.opacity = String(Math.max(1 - p * 1.2, 0));
  heroBody.style.transform = `translateY(${(p * -80).toFixed(1)}px) scale(${(1 - p * 0.04).toFixed(4)})`;
});

// ---------- Hero: an extra color blob eases toward the pointer ----------
if (finePointer && !reduceMotion) {
  const cursorBlob = hero.querySelector('.cursor-blob');
  const aura = hero.querySelector('.aura');
  let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
  const follow = () => {
    // Moves 8% of the remaining distance each frame, so it trails the cursor with momentum.
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    cursorBlob.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%, -50%)`;
    if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) requestAnimationFrame(follow);
    else running = false;
  };
  hero.addEventListener('pointermove', (e) => {
    const box = aura.getBoundingClientRect();
    tx = e.clientX - box.left;
    ty = e.clientY - box.top;
    hero.classList.add('has-pointer');
    if (!running) {
      running = true;
      requestAnimationFrame(follow);
    }
  });
  hero.addEventListener('pointerleave', () => hero.classList.remove('has-pointer'));
}

// ---------- Recent work: copy the cards once so the row loops without a gap ----------
const railTrack = document.querySelector('.rail-track');
const railSet = railTrack && railTrack.querySelector('.rail-set');
if (railSet && !reduceMotion) {
  const copy = railSet.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a, button, video').forEach((el) => el.setAttribute('tabindex', '-1'));
  railTrack.appendChild(copy);
}

// ---------- Reveal on scroll (with reduced motion it is a plain fade, see CSS) ----------
const revealTargets = document.querySelectorAll('[data-reveal]');
if (!('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-in'));
} else {
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => revealer.observe(el));
}

// ---------- Videos play only while on screen ----------
// With reduced motion they never autoplay: they show their still frame and play controls instead.
const videos = document.querySelectorAll('video.lazy-video');
if (reduceMotion) {
  videos.forEach((video) => {
    video.controls = true;
    video.preload = 'metadata';
  });
} else if (videos.length && 'IntersectionObserver' in window) {
  const player = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (video.preload === 'none') video.preload = 'auto';
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );
  videos.forEach((v) => player.observe(v));
}

// ---------- Showreel grows to full size as it scrolls in ----------
const showreel = document.querySelector('[data-grow]');
if (showreel && !reduceMotion) {
  let lastGrow = -1;
  onFrame(() => {
    const rect = showreel.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when its top enters the bottom of the screen, 1 when its top reaches 20% from the top.
    const p = Math.min(Math.max((vh - rect.top) / (vh * 0.8), 0), 1);
    if (Math.abs(p - lastGrow) < 0.001) return;
    lastGrow = p;
    showreel.style.transform = `scale(${(0.88 + p * 0.12).toFixed(4)})`;
  });
}

// ---------- Reels tilt toward the pointer ----------
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tilt').forEach((card) => {
    const media = card.querySelector('.media');
    card.addEventListener('pointermove', (e) => {
      const box = media.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      media.style.transform = `perspective(900px) rotateX(${(y * -14).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      media.style.transform = '';
    });
  });
}

// ---------- Services: one at a time, "Next" cycles through ----------
const services = [
  { title: 'Social Media Management', body: 'Keep your business active, engaging, and worth following. We handle content planning, creation, posting, and social strategy.', bg: 'linear-gradient(150deg, #ffb38a 0%, #ff9ec4 55%, #b8a6ff 100%)' },
  { title: 'AI Photography & Video', body: 'Professional-looking product photography, food visuals, promotional videos, and creative campaigns — without the cost and complexity of traditional production.', bg: 'linear-gradient(150deg, #1b1a4a 0%, #006eff 60%, #b8a6ff 100%)' },
  { title: 'Website Design & Development', body: 'Beautiful, easy-to-use websites designed to turn visitors into customers.', bg: 'linear-gradient(150deg, #b8a6ff 0%, #dfe3ff 50%, #006eff 100%)' },
  { title: 'SEO, GEO & Local Search', body: 'Help customers discover your business on Google, Maps, and AI-powered search platforms.', bg: 'linear-gradient(150deg, #006eff 0%, #6fd3c1 55%, #ffe27a 100%)' },
  { title: 'Advertising & Promotions', body: 'Targeted advertising, seasonal promotions, and creative campaigns designed to attract customers and generate interest.', bg: 'linear-gradient(150deg, #ffe27a 0%, #ffb38a 50%, #006eff 100%)' },
  { title: 'Branding & Creative Design', body: 'Menus, posters, promotional materials, and visual identities that make your business look as good as the experience you deliver.', bg: 'linear-gradient(150deg, #000000 0%, #2a2350 60%, #ff9ec4 100%)' },
];
const svcSection = document.querySelector('.services');
if (svcSection) {
  const part = (name) => svcSection.querySelector(`[data-svc="${name}"]`);
  let index = 0;
  let swapTimer = 0;
  const show = (i) => {
    const s = services[i];
    part('count').textContent = String(i + 1);
    part('n').textContent = String(i + 1).padStart(2, '0');
    part('title').textContent = s.title;
    part('body').textContent = s.body;
    part('caption').textContent = `[${s.title} — example]`;
    part('media').style.setProperty('--bg', s.bg);
  };
  part('next').addEventListener('click', () => {
    index = (index + 1) % services.length;
    if (reduceMotion) {
      show(index);
      return;
    }
    // Fast clicks never wait: each one restarts the short exit and lands on the latest service.
    clearTimeout(swapTimer);
    svcSection.classList.add('is-swapping');
    swapTimer = setTimeout(() => {
      show(index);
      svcSection.classList.remove('is-swapping');
    }, 150);
  });
}

// ---------- "Your business is unique": words light up in reading order as you scroll ----------
const manifesto = document.querySelector('[data-manifesto]');
if (manifesto) {
  const units = [];
  [...manifesto.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((piece) => {
        if (!piece) return;
        if (/^\s+$/.test(piece)) {
          frag.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = piece;
          frag.appendChild(span);
          units.push(span);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add('w');
      units.push(node);
    }
  });

  if (reduceMotion) {
    units.forEach((u) => u.classList.add('on'));
  } else {
    onFrame(() => {
      const rect = manifesto.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the text's top reaches 85% of the screen, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const progress = Math.min(Math.max((start - rect.top) / (start - end + rect.height), 0), 1);
      const count = Math.round(progress * units.length);
      units.forEach((u, i) => u.classList.toggle('on', i < count));
    });
  }
}
