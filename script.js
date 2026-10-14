const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
document.documentElement.dataset.scriptReady = 'true';

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  mobileMenu.hidden = isOpen;
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  });
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal sections and the fanned service cards as they scroll into view.
const revealTargets = document.querySelectorAll('[data-reveal], .fan');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-in'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => observer.observe(el));
}

// Manifesto: split the text into words, then light them up in reading order as the section scrolls through.
const manifesto = document.querySelector('[data-manifesto]');
if (manifesto) {
  const units = [];
  [...manifesto.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
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
    let pending = false;
    const light = () => {
      pending = false;
      const rect = manifesto.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the text's top reaches 85% of the screen, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const progress = Math.min(Math.max((start - rect.top) / (start - end + rect.height), 0), 1);
      const count = Math.round(progress * units.length);
      units.forEach((u, i) => u.classList.toggle('on', i < count));
    };
    const onScrollLight = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(light);
      }
    };
    window.addEventListener('scroll', onScrollLight, { passive: true });
    window.addEventListener('resize', onScrollLight);
    light();
  }
}

// Recent work: each card shrinks slightly as the next one slides over it.
const stackCards = [...document.querySelectorAll('.stack-card')];
stackCards.forEach((card, i) => card.style.setProperty('--n', i));

if (!reduceMotion && stackCards.length > 1) {
  let ticking = false;
  const update = () => {
    ticking = false;
    stackCards.forEach((card, i) => {
      const next = stackCards[i + 1];
      if (!next) return;
      const cardTop = card.getBoundingClientRect().top;
      const nextTop = next.getBoundingClientRect().top;
      const distance = Math.max(nextTop - cardTop, 0);
      const progress = 1 - Math.min(distance / card.offsetHeight, 1);
      card.style.setProperty('--scale', (1 - progress * 0.06).toFixed(4));
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
