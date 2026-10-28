'use strict';

// Googleフォーム作成後、この定数に公開URLを設定してください。
// 未設定の間は既存のメール問い合わせをフォールバックとして使用します。
const CONTACT_FORM_URL = '';
const CONTACT_FALLBACK_URL = 'mailto:sankakkee310@gmail.com?subject=' + encodeURIComponent('動画編集についての相談');

function initContactLinks() {
  const contactUrl = CONTACT_FORM_URL || CONTACT_FALLBACK_URL;
  document.querySelectorAll('[data-contact-link]').forEach((link) => {
    link.href = contactUrl;
    if (CONTACT_FORM_URL) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${link.textContent.trim()}（新しいタブで開きます）`);
    }
  });
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  items.forEach((item, index) => {
    if (item.closest('.hero')) item.style.transitionDelay = `${Math.min(index, 5) * 80}ms`;
    observer.observe(item);
  });
}

function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initContactLinks();
  initReveal();
  initNav();
});
