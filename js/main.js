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
    table:  document.getElementById('tab-table'),
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

      // カスタムタブを開いたとき再計算
      if (target === 'custom') {
        calcPrice();
      }
    });
  });
}

// ============================================================
// PRICE SIMULATOR — 計算ロジック
// ============================================================

const MANAGE_FEE   = 50000; // 運用管理費（固定）
const THUMB_PRICE  = 2500;  // サムネイル1枚あたり
const SUGGEST_LINE = 250000; // この金額を超えたらコミコミプランを提案

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
 * 編集費計算（形式別）
 * 座談形式：10分まで ¥15,000、3分超過ごと +¥3,000
 * ロケ形式：座談の1.5倍（10分まで ¥22,500、3分超過ごと +¥4,500）
 * @param {number} minutes - 動画の尺（分）
 * @param {boolean} isLocation - ロケ形式なら true
 * @returns {number}
 */
function calcEditCostPerVideo(minutes, isLocation) {
  const base   = 15000;
  const step   = 3000;
  const extra  = Math.max(0, Math.ceil((minutes - 10) / 3)) * step;
  const cost   = base + extra;
  return isLocation ? cost * 1.5 : cost;
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
  // 入力値
  const talkCount  = getCounterVal('talk-count');
  const talkMin    = getSliderVal('talk-minutes');
  const locCount   = getCounterVal('loc-count');
  const locMin     = getSliderVal('loc-minutes');
  const thumbCount = getCounterVal('thumb-count');
  const shootCount = getCounterVal('shoot-count');
  const shootHours = getSliderVal('shoot-hours');

  // 単価・小計
  const talkPerVid  = calcEditCostPerVideo(talkMin, false);
  const locPerVid   = calcEditCostPerVideo(locMin, true);
  const shootPerSes = calcShootCostPerSession(shootHours);

  const talkTotal  = talkCount  * talkPerVid;
  const locTotal   = locCount   * locPerVid;
  const thumbTotal = thumbCount * THUMB_PRICE;
  const shootTotal = shootCount * shootPerSes;
  const total      = MANAGE_FEE + talkTotal + locTotal + thumbTotal + shootTotal;

  // 各グループの小計表示
  document.getElementById('talk-subtotal').textContent  = yen(talkTotal);
  document.getElementById('loc-subtotal').textContent   = yen(locTotal);
  document.getElementById('thumb-subtotal').textContent = yen(thumbTotal);
  document.getElementById('shoot-subtotal').textContent = yen(shootTotal);

  // 合計内訳（数量があるものだけ表示）
  const rows = [
    { label: '運用管理費（固定）', value: MANAGE_FEE, show: true },
    {
      label: `編集費・座談（${talkCount}本 × ${talkMin}分 → ${yen(talkPerVid)}/本）`,
      value: talkTotal, show: talkCount > 0,
    },
    {
      label: `編集費・ロケ（${locCount}本 × ${locMin}分 → ${yen(locPerVid)}/本）`,
      value: locTotal, show: locCount > 0,
    },
    {
      label: `サムネイル（${thumbCount}枚 × ${yen(THUMB_PRICE)}）`,
      value: thumbTotal, show: thumbCount > 0,
    },
    {
      label: `撮影費（${shootCount}回 × ${shootHours}時間 → ${yen(shootPerSes)}/回）`,
      value: shootTotal, show: shootCount > 0,
    },
  ];

  document.getElementById('sim-breakdown').innerHTML = rows
    .filter((r) => r.show)
    .map((r) => `
      <div class="price__sim-breakdown-item">
        <span>${r.label}</span>
        <span>${yen(r.value)}</span>
      </div>`)
    .join('');

  document.getElementById('sim-total').textContent = yen(total);

  // コミコミプラン提案メッセージ
  const suggestEl = document.getElementById('price-suggest');
  suggestEl.classList.toggle('price__suggest--hidden', total <= SUGGEST_LINE);
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
      const next     = Math.max(0, current + dir);

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
  // 値表示とスライダーIDの対応
  const pairs = [
    ['talk-minutes',  'talk-minutes-val'],
    ['loc-minutes',   'loc-minutes-val'],
    ['shoot-hours',   'shoot-hours-val'],
  ];

  pairs.forEach(([sliderId, displayId]) => {
    const slider  = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    slider.addEventListener('input', () => {
      display.textContent = slider.value;
      calcPrice();
    });
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
