/* ============================================================
   サンカッケー LP — main.js
============================================================ */

'use strict';

// ============================================================
// HERO FADE-UP (load時にシーケンシャル発火)
// ============================================================
function initHeroAnimation() {
  const heroEls = document.querySelectorAll('.hero .fade-up');
  heroEls.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 200 + i * 180);
  });
}

// ============================================================
// SCROLL FADE-UP (IntersectionObserver)
// ============================================================
function initScrollAnimation() {
  const nonHeroEls = document.querySelectorAll('.fade-up:not(.hero .fade-up)');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  nonHeroEls.forEach((el) => observer.observe(el));
}

// ============================================================
// NAV スクロール時スタイル
// ============================================================
function initNav() {
  const nav = document.getElementById('nav');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 60) {
          nav.classList.add('nav--scrolled');
        } else {
          nav.classList.remove('nav--scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initHeroAnimation();
  initScrollAnimation();
  initNav();
});
