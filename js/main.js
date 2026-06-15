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
// PRICE TABS
// ============================================================
function initTabs() {
  const tabs = document.querySelectorAll('.price__tab');
  const panels = {
    fixed:  document.getElementById('tab-fixed'),
    custom: document.getElementById('tab-custom'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // ボタン状態更新
      tabs.forEach((t) => t.classList.remove('price__tab--active'));
      tab.classList.add('price__tab--active');

      // パネル切り替え
      const target = tab.dataset.tab;
      Object.entries(panels).forEach(([key, panel]) => {
        if (key === target) {
          panel.classList.remove('price__panel--hidden');
        } else {
          panel.classList.add('price__panel--hidden');
        }
      });

      // カスタムタブを開いたとき初期計算
      if (target === 'custom') {
        calcPrice();
      }
    });
  });
}

// ============================================================
// PRICE SIMULATOR — 計算ロジック
// ============================================================

/**
 * 撮影費計算
 * 3時間まで ¥15,000、超過1hごと +¥5,000
 * @param {number} hours - 撮影時間（時間）
 * @returns {number}
 */
function calcShootCostPerSession(hours) {
  const base  = 15000;
  const extra = Math.max(0, Math.ceil(hours - 3)) * 5000;
  return base + extra;
}

/**
 * 編集費計算
 * 10分まで ¥15,000、3分超過ごと +¥3,000
 * @param {number} minutes - 動画の尺（分）
 * @returns {number}
 */
function calcEditCostPerVideo(minutes) {
  const base  = 15000;
  const extra = Math.max(0, Math.ceil((minutes - 10) / 3)) * 3000;
  return base + extra;
}

/** 金額をカンマ区切り円表示に変換 */
function yen(amount) {
  return '¥' + amount.toLocaleString('ja-JP');
}

/** カウンター値を読む */
function getCounterVal(id) {
  return parseInt(document.getElementById(id).textContent, 10);
}

/** スライダー値を読む */
function getSliderVal(id) {
  return parseInt(document.getElementById(id).value, 10);
}

function calcPrice() {
  const shootCount   = getCounterVal('shoot-count');
  const shootHours   = getSliderVal('shoot-hours');
  const editCount    = getCounterVal('edit-count');
  const editMinutes  = getSliderVal('edit-minutes');

  const manageFee    = 50000;
  const shootPerSess = calcShootCostPerSession(shootHours);
  const editPerVid   = calcEditCostPerVideo(editMinutes);
  const totalShoot   = shootCount * shootPerSess;
  const totalEdit    = editCount  * editPerVid;
  const total        = manageFee + totalShoot + totalEdit;

  // 内訳 HTML 生成
  const breakdownEl = document.getElementById('sim-breakdown');
  breakdownEl.innerHTML = `
    <div class="price__sim-breakdown-item">
      <span>運用管理費（固定）</span>
      <span>${yen(manageFee)}</span>
    </div>
    <div class="price__sim-breakdown-item">
      <span>撮影費（${shootCount}回 × ${shootHours}時間 → ${yen(shootPerSess)}/回）</span>
      <span>${yen(totalShoot)}</span>
    </div>
    <div class="price__sim-breakdown-item">
      <span>編集費（${editCount}本 × ${editMinutes}分 → ${yen(editPerVid)}/本）</span>
      <span>${yen(totalEdit)}</span>
    </div>
  `;

  document.getElementById('sim-total').textContent = yen(total);
}

// ============================================================
// COUNTER ボタン
// ============================================================
function initCounters() {
  document.querySelectorAll('.counter__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const valEl    = document.getElementById(targetId);
      const dir      = parseInt(btn.dataset.dir, 10);
      const current  = parseInt(valEl.textContent, 10);
      const next     = Math.max(1, current + dir);

      if (next !== current) {
        valEl.textContent = next;
        calcPrice();
      }
    });
  });
}

// ============================================================
// SLIDER
// ============================================================
function initSliders() {
  // 撮影時間スライダー
  const shootSlider  = document.getElementById('shoot-hours');
  const shootDisplay = document.getElementById('shoot-hours-val');

  shootSlider.addEventListener('input', () => {
    shootDisplay.textContent = shootSlider.value;
    calcPrice();
  });

  // 尺スライダー
  const editSlider  = document.getElementById('edit-minutes');
  const editDisplay = document.getElementById('edit-minutes-val');

  editSlider.addEventListener('input', () => {
    editDisplay.textContent = editSlider.value;
    calcPrice();
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initHeroAnimation();
  initScrollAnimation();
  initNav();
  initTabs();
  initCounters();
  initSliders();
  calcPrice(); // 初期表示（カスタムタブ非表示でも計算しておく）
});
