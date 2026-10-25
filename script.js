/* =========================================================
   Tropical Horizons — поведение сайта
   ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ДАННЫЕ (меняй тексты здесь) ---------- */

const DAYS = [
  ['Welcome to Bangkok', 'Airport pick-up, check-in by the Chao Phraya river and a sunset dinner cruise past the illuminated temples.'],
  ['Temples and the Grand Palace', 'Morning at the Grand Palace and Wat Pho with its 46-metre reclining Buddha, then a long-tail boat to Wat Arun.'],
  ['Markets and Culinary Classes', 'A floating market at dawn, then a hands-on cooking class: green curry, pad thai and mango sticky rice.'],
  ['Transfer to Phi Phi Island', 'A short flight to Krabi and a speedboat to Phi Phi. Afternoon free on the beach, sunset at the viewpoint.'],
  ['Marine Adventures', 'Snorkelling in Maya Bay and Pileh Lagoon, swimming with reef fish and lunch on a secluded beach.'],
  ['Spiritual Immersion', 'A morning meditation with a monk, a visit to the Tiger Cave Temple and a traditional Thai massage.'],
  ['Shopping and Leisure', 'Free day: night markets, local crafts and souvenirs, or simply a hammock between two palm trees.'],
  ['Return Home', 'A slow breakfast with a sea view, transfer to the airport and memories that will last a lifetime.'],
];

/* slots = 0 → «Sold out» (кнопка в состоянии Disabled) */
const TOURS = [
  { date: '21 April', day: 'Wednesday', slots: 2 },
  { date: '30 April', day: 'Friday', slots: 5 },
  { date: '09 May', day: 'Sunday', slots: 0 },
  { date: '20 May', day: 'Thursday', slots: 4 },
  { date: '29 May', day: 'Saturday', slots: 1 },
  { date: '07 June', day: 'Monday', slots: 6 },
  { date: '18 June', day: 'Friday', slots: 3 },
  { date: '26 June', day: 'Saturday', slots: 8 },
];

const REVIEWS = [
  { name: 'Isabella', date: '21.11.2025', img: 'img/r-1.webp', text: 'Everything was planned down to the minute, yet it never felt rushed. The cooking class in Bangkok and the morning in Maya Bay were the highlights of my year.' },
  { name: 'Daniel', date: '04.12.2025', img: 'img/r-2.webp', text: 'Our guide knew every hidden corner of the Grand Palace. Hotels were spotless and the transfers just worked. Already planning the next trip with Tropical Horizons.' },
  { name: 'Sofia', date: '17.01.2026', img: 'img/r-3.webp', text: 'I travelled alone and felt looked after the whole time. The meditation with a monk was something I will never forget.' },
  { name: 'Arjun', date: '02.02.2026', img: 'img/r-4.webp', text: 'Snorkelling with reef sharks, street food at midnight, sunsets every evening. Eight days felt like a month in the best way.' },
  { name: 'Marcus', date: '15.03.2026', img: 'img/r-5.webp', text: 'Great value and zero stress. Small group, friendly people and a perfect balance of adventure and rest.' },
];

const GALLERY = $$('#mosaic .tile img').map(img => ({ src: img.getAttribute('src'), alt: img.alt }));

/* ---------- ШАПКА: плотнее при скролле + активная ссылка ---------- */
const header = $('#header');
const onScroll = () => {
  header.classList.toggle('is-scrolled', scrollY > 40);
  if (!reduceMotion && scrollY < innerHeight) {
    document.documentElement.style.setProperty('--hero-shift', scrollY * 0.25 + 'px');
  }
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navMap = { home: 'Home', program: 'Tours', reservation: 'Tours', gallery: 'Gallery', contact: 'Contact' };
const navLinks = $$('.nav__link');
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const label = navMap[e.target.id];
    navLinks.forEach(a => a.classList.toggle('is-active', a.textContent === label));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
Object.keys(navMap).forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });

/* ---------- МОБИЛЬНОЕ МЕНЮ ---------- */
const burger = $('#burger');
const menu = $('#mobile-menu');
const setMenu = open => {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); }
  else { menu.classList.remove('open'); setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 500); }
  document.body.style.overflow = open ? 'hidden' : '';
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

/* ---------- ПРОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ---------- */
const revealer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => revealer.observe(el));

/* лёгкий параллакс фото в капсулах и фона Discover */
const parallaxEls = $$('.capsule img, .discover__bg img');
let ticking = false;
const parallax = () => {
  parallaxEls.forEach(img => {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const progress = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
    const k = img.closest('.discover') ? 60 : 8;
    img.style.setProperty('--py', img.closest('.discover') ? `${progress * -k}px` : `${-8 + progress * -k}%`);
  });
  ticking = false;
};
if (!reduceMotion) {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
  parallax();
}

/* ---------- ПРОГРАММА: лодочка плывёт по маршруту вместе со скроллом ---------- */
const wrap = $('#route-wrap');
const routeSvg = $('#route');
const track = $('.route__track');
const done = $('.route__done');
const boat = $('#boat');
const dayItems = $$('.day', wrap);
const card = $('#day-card');
let routeLen = 0, stops = [], shownDay = -1, boatDay = -1, dock = 60;

const showDay = i => {
  if (i === shownDay) return;
  shownDay = i;
  dayItems.forEach((li, k) => li.classList.toggle('is-active', k === i));
  $('#day-card-num').textContent = i + 1;
  $('#day-card-title').textContent = DAYS[i][0];
  $('#day-card-text').textContent = DAYS[i][1];
  card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
};
dayItems.forEach((li, i) => {
  const btn = $('button', li);
  btn.addEventListener('click', () => showDay(i));
  btn.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) showDay(i); });
});

// путь через центры кружков в порядке дней 1 → 8
const buildRoute = () => {
  const box = wrap.getBoundingClientRect();
  const pts = dayItems.map(li => {
    const r = $('.day__num', li).getBoundingClientRect();
    return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
  });
  dock = $('.day__num', dayItems[0]).offsetWidth / 2 + 34; // лодка «причаливает» у кружка, а не заезжает на цифру
  routeSvg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  const d = 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(' ')).join(' L');
  track.setAttribute('d', d); done.setAttribute('d', d);
  routeLen = done.getTotalLength();
  let acc = 0;
  stops = pts.map((p, i) => i === 0 ? 0 : (acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])));
  done.style.strokeDasharray = routeLen;
  moveBoat();
};

const moveBoat = () => {
  if (!routeLen) return;
  const r = wrap.getBoundingClientRect();
  const start = innerHeight * 0.75;
  let p = (start - r.top) / (r.height + innerHeight * 0.15);
  p = reduceMotion ? 1 : Math.min(1, Math.max(0, p));
  const L = p * (routeLen - dock);
  done.style.strokeDashoffset = routeLen - L;

  const pt = done.getPointAtLength(L);
  const ahead = done.getPointAtLength(Math.min(routeLen, L + 2));
  const behind = done.getPointAtLength(Math.max(0, L - 2));
  const dx = ahead.x - behind.x, dy = ahead.y - behind.y;
  // по горизонтали лодка разворачивается носом по ходу, на спуске — наклоняется вниз
  let t = `translate(${pt.x}px, ${pt.y}px)`;
  if (Math.abs(dy) > Math.abs(dx)) t += ' rotate(90deg)';
  else if (dx < 0) t += ' scaleX(-1)';
  boat.style.transform = t;

  let reached = 0;
  stops.forEach((s, i) => { if (L >= s - dock) reached = i; });
  dayItems.forEach((li, i) => li.classList.toggle('is-reached', L >= stops[i] - dock && p > 0));
  if (reached !== boatDay) { boatDay = reached; if (p > 0) showDay(reached); }
};

let routeTick = false;
addEventListener('scroll', () => { if (!routeTick) { routeTick = true; requestAnimationFrame(() => { moveBoat(); routeTick = false; }); } }, { passive: true });
addEventListener('resize', buildRoute);
document.fonts && document.fonts.ready.then(buildRoute);
buildRoute();

/* ---------- БРОНИРОВАНИЕ ---------- */
const resList = $('#res-list');
const rowHTML = (t, idx) => {
  const full = t.slots === 0;
  const slotsText = full ? 'Sold out' : `${t.slots} ${t.slots === 1 ? 'seat' : 'seats'}`;
  return `
  <div class="res-row${full ? ' is-full' : ''}">
    <p class="res-date">${t.date}<small>${t.day}</small></p>
    <p class="res-stat">Start<b>10:00</b></p>
    <p class="res-stat">Duration<b>8 Days</b></p>
    <p class="res-stat">Available<b class="${t.slots && t.slots <= 2 ? 'low' : ''}">${slotsText}</b></p>
    <button class="btn btn--sm" type="button" data-tour="${idx}" ${full ? 'disabled' : ''}>${full ? 'Full' : 'Book'}<svg class="btn__arrow" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5"/></svg></button>
  </div>`;
};
const VISIBLE = 5;
resList.innerHTML =
  TOURS.slice(0, VISIBLE).map(rowHTML).join('') +
  `<div class="res-extra" id="res-extra"><div>${TOURS.slice(VISIBLE).map((t, i) => rowHTML(t, i + VISIBLE)).join('')}</div></div>`;

const moreBtn = $('#res-more');
moreBtn.addEventListener('click', () => {
  const open = $('#res-extra').classList.toggle('open');
  moreBtn.setAttribute('aria-expanded', open);
  moreBtn.setAttribute('aria-label', open ? 'Show fewer dates' : 'Show more dates');
});

/* модалка бронирования */
const modal = $('#book-modal');
const form = $('#book-form');
let guests = 1, currentTour = null;
resList.addEventListener('click', e => {
  const btn = e.target.closest('[data-tour]');
  if (!btn) return;
  currentTour = TOURS[+btn.dataset.tour];
  guests = 1; $('#guests').textContent = guests;
  $('#book-tour').textContent = `${currentTour.date} · 10:00 · 8 days · ${currentTour.slots} ${currentTour.slots === 1 ? 'seat' : 'seats'} left`;
  $('#book-error').textContent = '';
  form.reset();
  modal.showModal();
});
$$('[data-step]', modal).forEach(b => b.addEventListener('click', () => {
  guests = Math.min(currentTour.slots, Math.max(1, guests + +b.dataset.step));
  $('#guests').textContent = guests;
}));
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); }); // клик по фону
form.addEventListener('submit', e => {
  if (e.submitter && e.submitter.value === 'cancel') return;
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  if (!name) { $('#book-error').textContent = 'Please enter your name.'; form.name.focus(); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { $('#book-error').textContent = 'Please enter a valid email.'; form.email.focus(); return; }
  modal.close();
  toast(`Thank you, ${name.split(' ')[0]}! ${guests} ${guests === 1 ? 'seat' : 'seats'} on ${currentTour.date} reserved (demo).`);
});

/* ---------- ОТЗЫВЫ: карусель ---------- */
const reviewTrack = $('#track');
const dotsBox = $('#dots');
reviewTrack.innerHTML = REVIEWS.map(r => `
  <article class="review">
    <img src="${r.img}" alt="${r.name}" loading="lazy" width="120" height="120">
    <div>
      <h3>${r.name}</h3>
      <p class="review__meta"><span>${r.date}</span><span class="stars" aria-label="5 out of 5">★★★★★</span></p>
      <p>${r.text}</p>
    </div>
  </article>`).join('');
dotsBox.innerHTML = REVIEWS.map((r, i) => `<button role="tab" aria-label="Review ${i + 1}" aria-selected="false"></button>`).join('');

const slides = $$('.review', reviewTrack);
const dots = $$('button', dotsBox);
let current = Math.floor(REVIEWS.length / 2); // как в макете — активна средняя точка
let autoplay;

const goTo = i => {
  current = (i + slides.length) % slides.length;
  const s = slides[current];
  const viewport = reviewTrack.parentElement;
  const offset = s.offsetLeft + s.offsetWidth / 2 - viewport.offsetWidth / 2;
  reviewTrack.style.transform = `translateX(${-offset}px)`;
  slides.forEach((el, k) => el.classList.toggle('is-current', k === current));
  dots.forEach((d, k) => d.setAttribute('aria-selected', k === current));
};
const restart = () => { clearInterval(autoplay); if (!reduceMotion) autoplay = setInterval(() => goTo(current + 1), 6000); };

$('.carousel__arrow--prev').addEventListener('click', () => { goTo(current - 1); restart(); });
$('.carousel__arrow--next').addEventListener('click', () => { goTo(current + 1); restart(); });
dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); restart(); }));
slides.forEach((s, i) => s.addEventListener('click', () => { if (i !== current) { goTo(i); restart(); } }));
$('#carousel').addEventListener('mouseenter', () => clearInterval(autoplay));
$('#carousel').addEventListener('mouseleave', restart);

// свайп пальцем
let startX = null;
reviewTrack.addEventListener('pointerdown', e => { startX = e.clientX; });
addEventListener('pointerup', e => {
  if (startX === null) return;
  const dx = e.clientX - startX; startX = null;
  if (Math.abs(dx) > 50) { goTo(current + (dx < 0 ? 1 : -1)); restart(); }
});
addEventListener('resize', () => goTo(current));
goTo(current);
restart();

/* ---------- ГАЛЕРЕЯ + СЛАЙДШОУ ---------- */
const lb = $('#lightbox');
const lbImg = $('#lb-img');
let lbIndex = 0, slideshow = null;

const showPhoto = i => {
  lbIndex = (i + GALLERY.length) % GALLERY.length;
  lbImg.src = GALLERY[lbIndex].src;
  lbImg.alt = GALLERY[lbIndex].alt;
  $('#lb-cap').textContent = `${lbIndex + 1} / ${GALLERY.length} — ${GALLERY[lbIndex].alt}`;
  lbImg.classList.remove('swap'); void lbImg.offsetWidth; lbImg.classList.add('swap');
  if (slideshow) { const bar = $('#lb-progress'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
};
const stopShow = () => { clearInterval(slideshow); slideshow = null; lb.classList.remove('is-playing'); };
const openLightbox = (i, play = false) => {
  stopShow();
  if (play) { lb.classList.add('is-playing'); slideshow = setInterval(() => showPhoto(lbIndex + 1), 4000); }
  showPhoto(i);
  lb.showModal();
};

$$('#mosaic .tile').forEach(t => t.addEventListener('click', () => openLightbox(+t.dataset.i)));
$('#play-btn').addEventListener('click', () => openLightbox(0, true));
$('.lightbox__prev, .lightbox__nav--prev').addEventListener('click', () => { stopShow(); showPhoto(lbIndex - 1); });
$('.lightbox__nav--next').addEventListener('click', () => { stopShow(); showPhoto(lbIndex + 1); });
$('.lightbox__close').addEventListener('click', () => lb.close());
lb.addEventListener('close', stopShow);
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { stopShow(); showPhoto(lbIndex + 1); }
  if (e.key === 'ArrowLeft') { stopShow(); showPhoto(lbIndex - 1); }
});

/* ---------- ЗАКАТ: на телефонах солнце садится само, когда футер на экране ---------- */
if (!matchMedia('(hover: hover)').matches) {
  new IntersectionObserver(([e]) => $('#sunset').classList.toggle('dusk', e.isIntersecting), { threshold: 0.7 }).observe($('#sunset'));
}

/* ---------- ПОДПИСКА ---------- */
$('#subscribe').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#email');
  const msg = $('#subscribe-msg');
  if (!/^\S+@\S+\.\S+$/.test(input.value.trim())) { msg.textContent = 'Please enter a valid email.'; input.focus(); return; }
  msg.textContent = '';
  input.value = '';
  toast('You are subscribed! Travel news is on its way.');
});

/* ---------- ТОСТ ---------- */
let toastTimer;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
}
