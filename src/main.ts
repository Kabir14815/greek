import './style.css';
import { initScene } from './scene';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Initialize 3D scene
const canvas = document.getElementById('canvas-3d') as HTMLCanvasElement;
let setScrollProgress: (p: number) => void = () => {};
if (canvas) {
  const sceneApi = initScene(canvas);
  setScrollProgress = sceneApi.setScrollProgress;
}

// Scroll = entering: approach → pass through entrance → inside (progress 0→0.5)
ScrollTrigger.create({
  trigger: '.interior-section',
  start: 'top bottom',
  end: 'bottom center',
  scrub: 1,
  onUpdate: (self) => setScrollProgress(self.progress * 0.5),
});
ScrollTrigger.create({
  trigger: '.underground-section',
  start: 'top bottom',
  end: 'center center',
  scrub: 0.8,
  onUpdate: (self) => setScrollProgress(0.5 + self.progress * 0.5),
});
ScrollTrigger.create({
  trigger: '.underground-section',
  start: 'center center',
  end: 'bottom top',
  scrub: 0.5,
  onUpdate: () => setScrollProgress(1),
});

// Section overlays visible when in view
ScrollTrigger.create({
  trigger: '.interior-section',
  start: 'center 60%',
  onEnter: () => document.querySelector('.interior-section')?.classList.add('is-visible'),
});
ScrollTrigger.create({
  trigger: '.underground-section',
  start: 'center 60%',
  onEnter: () => document.querySelector('.underground-section')?.classList.add('is-visible'),
});

// Premium hero entrance - cinematic timing
gsap.from('.hero-tagline', {
  opacity: 0,
  y: 40,
  duration: 1.2,
  delay: 0.4,
  ease: 'power3.out',
});

gsap.from('.hero-title .title-line', {
  opacity: 0,
  y: 80,
  duration: 1.4,
  delay: 0.7,
  stagger: 0.25,
  ease: 'power4.out',
  overwrite: 'auto',
});

gsap.from('.hero-subtitle', {
  opacity: 0,
  y: 40,
  duration: 1.2,
  delay: 1.3,
  ease: 'power3.out',
});

gsap.from('.hero-cta', {
  opacity: 0,
  y: 30,
  duration: 1,
  delay: 1.7,
  stagger: 0.15,
  ease: 'power3.out',
});

// Scroll indicator - premium bounce
gsap.to('.scroll-arrow', {
  y: 10,
  duration: 1.4,
  repeat: -1,
  yoyo: true,
  ease: 'power2.inOut',
  delay: 2.5,
});

// Magnetic button effect
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const me = e as MouseEvent;
    const rect = (btn as HTMLElement).getBoundingClientRect();
    const x = (me.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (me.clientY - rect.top - rect.height / 2) * 0.3;
    gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  });
});

// Stats counter animation
document.querySelectorAll('.stat-item').forEach((item) => {
  const numEl = item.querySelector('.stat-number') as HTMLElement;
  const target = numEl?.dataset.count ? parseInt(numEl.dataset.count, 10) : 0;
  if (!numEl || isNaN(target)) return;
  ScrollTrigger.create({
    trigger: item,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      let current = 0;
      const duration = 1500;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        current = Math.floor(target * (1 - Math.pow(1 - progress, 2)));
        numEl.textContent = String(current);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  });
});

// Stats section reveal
gsap.from('.stats-grid', {
  scrollTrigger: { trigger: '.stats-section', start: 'top 80%', toggleActions: 'play none none reverse' },
  opacity: 0,
  y: 40,
  duration: 1,
  ease: 'power3.out',
});

// Heritage section
gsap.from('.heritage-content', {
  scrollTrigger: { trigger: '.heritage-section', start: 'top 82%', toggleActions: 'play none none reverse' },
  opacity: 0,
  y: 50,
  duration: 1.2,
  ease: 'power3.out',
});

// Projects section
gsap.from('.projects-heading', {
  scrollTrigger: { trigger: '.projects-section', start: 'top 85%', toggleActions: 'play none none reverse' },
  opacity: 0,
  y: 30,
  duration: 0.8,
  ease: 'power3.out',
});
document.querySelectorAll('.project-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: { trigger: '.projects-section', start: 'top 80%', toggleActions: 'play none none reverse' },
    opacity: 0,
    y: 40,
    duration: 0.8,
    delay: i * 0.1,
    ease: 'power3.out',
  });
});

// Project cards hover
document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      duration: 0.35,
      ease: 'power2.out',
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { boxShadow: 'none', duration: 0.35, ease: 'power2.out' });
  });
});

// Second quote
gsap.from('.quote-section-secondary .greek-quote', {
  scrollTrigger: { trigger: '.quote-section-secondary', start: 'top 85%', toggleActions: 'play none none reverse' },
  opacity: 0,
  scale: 0.98,
  y: 25,
  duration: 1.2,
  ease: 'power3.out',
});

// Feature cards - premium reveal with scale + rotation
document.querySelectorAll('.feature-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: 'top 88%',
      toggleActions: 'play none none reverse',
    },
    opacity: 0,
    y: 100,
    scale: 0.92,
    duration: 1.2,
    delay: i * 0.12,
    ease: 'power3.out',
  });

  // Hover lift effect (scale + glow, avoids parallax conflict)
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      scale: 1.02,
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)',
      duration: 0.4,
      ease: 'power2.out',
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      scale: 1,
      boxShadow: 'none',
      duration: 0.4,
      ease: 'power2.out',
    });
  });
});

// Quote - premium reveal with line draw feel
gsap.from('.greek-quote', {
  scrollTrigger: {
    trigger: '.quote-section',
    start: 'top 78%',
    toggleActions: 'play none none reverse',
  },
  opacity: 0,
  scale: 0.96,
  y: 30,
  duration: 1.4,
  ease: 'power3.out',
});

gsap.from('.quote-mark', {
  scrollTrigger: {
    trigger: '.quote-section',
    start: 'top 78%',
    toggleActions: 'play none none reverse',
  },
  opacity: 0,
  scale: 2,
  duration: 0.8,
  delay: 0.2,
  ease: 'back.out(1.7)',
});

// CTA section - premium entrance
gsap.from('.cta-content', {
  scrollTrigger: {
    trigger: '.cta-section',
    start: 'top 82%',
    toggleActions: 'play none none reverse',
  },
  opacity: 0,
  y: 60,
  scale: 0.98,
  duration: 1.2,
  ease: 'power3.out',
});

// CTA button shimmer on scroll into view
gsap.from('.btn-gold', {
  scrollTrigger: {
    trigger: '.cta-section',
    start: 'top 82%',
    toggleActions: 'play none none reverse',
  },
  opacity: 0,
  y: 20,
  duration: 0.8,
  delay: 0.4,
  ease: 'power2.out',
});

// Parallax on scroll for feature cards
document.querySelectorAll('[data-parallax]').forEach((el) => {
  const speed = parseFloat((el as HTMLElement).dataset.parallax || '0.1');
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5,
    },
    y: () => -window.innerHeight * speed,
    ease: 'none',
  });
});

// Header - smooth backdrop on scroll
gsap.to('.header', {
  scrollTrigger: {
    trigger: document.body,
    start: '80px top',
    end: '180px top',
    scrub: 0.5,
  },
  backgroundColor: 'rgba(10, 10, 18, 0.92)',
  backdropFilter: 'blur(14px)',
});

// Nav links - subtle stagger on load
gsap.from('.nav-links li', {
  opacity: 0,
  x: -15,
  duration: 0.6,
  stagger: 0.08,
  delay: 1.2,
  ease: 'power2.out',
});
