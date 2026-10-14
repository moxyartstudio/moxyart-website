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

// ---------- Header turns cream after the hero starts scrolling ----------
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroBody = document.querySelector('.hero-body');
onFrame(() => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  if (!reduceMotion) {
    // 0 at the top, 1 once the hero has mostly scrolled away.
    const p = Math.min(Math.max(y / (hero.offsetHeight * 0.75), 0), 1);
    heroBody.style.setProperty('--hero-p', p.toFixed(3));
  }
});

// ---------- Hero: an extra color blob follows the pointer ----------
if (finePointer && !reduceMotion) {
  const cursorBlob = hero.querySelector('.cursor-blob');
  const aura = hero.querySelector('.aura');
  let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
  const follow = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    cursorBlob.style.setProperty('--cx', `${cx}px`);
    cursorBlob.style.setProperty('--cy', `${cy}px`);
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

// ---------- Reveal on scroll ----------
const revealTargets = document.querySelectorAll('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
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

// ---------- Videos play only while on screen (for when real clips are added) ----------
const videos = document.querySelectorAll('video.lazy-video');
if (videos.length && 'IntersectionObserver' in window) {
  const player = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && !reduceMotion) {
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
  onFrame(() => {
    const rect = showreel.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when its top enters the bottom of the screen, 1 when its top reaches 20% from the top.
    const p = Math.min(Math.max((vh - rect.top) / (vh * 0.8), 0), 1);
    showreel.style.setProperty('--grow', p.toFixed(3));
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
      media.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
      media.style.setProperty('--rx', `${(y * -14).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      media.style.setProperty('--ry', '0deg');
      media.style.setProperty('--rx', '0deg');
    });
  });
}

// ---------- Services: one at a time, "Next" cycles through ----------
const services = [
  { n: '01', title: 'AI video & Reels', lead: 'Made for the phone.', body: 'Short videos of your food, your room and your people, made faster with AI.', bg: 'linear-gradient(150deg, #1b1a4a 0%, #006eff 60%, #b8a6ff 100%)' },
  { n: '02', title: 'Social content', lead: 'Done for you.', body: 'Posts, Reels and a monthly calendar, shot and written for you.', bg: 'linear-gradient(150deg, #ffb38a 0%, #ff9ec4 55%, #b8a6ff 100%)' },
  { n: '03', title: 'Local Meta ads', lead: 'Small budgets, local reach.', body: 'Targeted ads aimed at the people in your neighborhood.', bg: 'linear-gradient(150deg, #ffe27a 0%, #ffb38a 50%, #006eff 100%)' },
  { n: '04', title: 'Monthly report', lead: 'Plain English.', body: 'One page: what worked and what changes next.', bg: 'linear-gradient(150deg, #000000 0%, #2a2350 60%, #006eff 100%)' },
];
const svcSection = document.querySelector('.services');
if (svcSection) {
  const part = (name) => svcSection.querySelector(`[data-svc="${name}"]`);
  let index = 0;
  const show = (i) => {
    const s = services[i];
    part('count').textContent = String(i + 1);
    part('n').textContent = s.n;
    part('title').textContent = s.title;
    part('lead').textContent = s.lead;
    part('body').textContent = s.body;
    part('caption').textContent = `[${s.title} — example video]`;
    part('media').style.setProperty('--bg', s.bg);
  };
  part('next').addEventListener('click', () => {
    index = (index + 1) % services.length;
    if (reduceMotion) {
      show(index);
      return;
    }
    svcSection.classList.add('is-swapping');
    setTimeout(() => {
      show(index);
      svcSection.classList.remove('is-swapping');
    }, 280);
  });
}

// ---------- Manifesto: words light up in reading order as you scroll ----------
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
