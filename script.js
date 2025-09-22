// ==============================
// NEXORA - script.js (이슈 3건 반영 전면 교체본)
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

// ─────────────────────────────────────
// SECTION 2 (ScrollTrigger)
// ─────────────────────────────────────
(function initSection2_ST(){
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const sec2    = document.querySelector('#sec-2');
  const line    = document.querySelector('.center-line');
  const reveal  = document.querySelector('.video-reveal');
  const videoEl = document.querySelector('.hero-video');
  if (!sec2 || !line || !reveal || !videoEl) return;

  // 초기 세팅
  gsap.set(line,   { visibility:'hidden', opacity:0, scaleY:0, transformOrigin:'top center' });
  gsap.set(reveal, { opacity:1, '--gap':'50%' });

  const tl = gsap.timeline({ paused:true, defaults:{ immediateRender:false } });

  tl
    // 라인: 위에서 아래로만 쭉 확장
    .set(line, { visibility:'visible', opacity:1 })
    .to(line, { scaleY:1, duration:1.2, ease:'power3.out' }, 0)

    // 비디오 reveal 시작과 동시에 라인 즉시 제거
    .addLabel('reveal')
    .set(line, { opacity:0, visibility:'hidden' }, 'reveal')
    .to(reveal, { '--gap':'0%', duration:1.0, ease:'power3.inOut' }, 'reveal');

  let revealedOnce = false;

  const playVideoSmooth = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { videoEl.play().catch(()=>{}); });
    });
  };

  ScrollTrigger.create({
    trigger: sec2,
    start: 'top 75%',
    end: 'bottom top',
    onEnter: () => {
      if (!revealedOnce) {
        if (videoEl.readyState >= 2) { tl.play(0); revealedOnce = true; }
        else {
          const onReady = () => { tl.play(0); revealedOnce = true; videoEl.removeEventListener('canplay', onReady); };
          videoEl.addEventListener('canplay', onReady, { once:true });
        }
      }
      playVideoSmooth();
    },
    onEnterBack: () => playVideoSmooth(),
    onLeave:     () => { try { videoEl.pause(); } catch(_){} },
    onLeaveBack: () => { try { videoEl.pause(); } catch(_){} }
  });
})();




  // ─────────────────────────────────────
  // 2) Swiper (섹션3/섹션4) + 드래그 중 페이징 잠금
  // ─────────────────────────────────────
  let isDraggingSwiper = false;     // ★ 섹션 페이징과 충돌 방지용 플래그
  let dragReleaseTimer = null;

  const setDragging = (v) => {
    isDraggingSwiper = v;
    if (dragReleaseTimer) { clearTimeout(dragReleaseTimer); dragReleaseTimer = null; }
    if (!v) {
      // 드래그 종료 후 잠깐 더 유예 (남은 휠/관성 입력 무시)
      dragReleaseTimer = setTimeout(() => { isDraggingSwiper = false; }, 180);
    }
  };

  (function initSwipers(){
    // 섹션3
    const consSwiper = new Swiper('.cons-swiper', {
      slidesPerView: 'auto',
      spaceBetween: 105,
      centeredSlides: false,
      watchOverflow: true,
      simulateTouch: true,
      threshold: 6,
      touchRatio: 1,
      freeMode: { enabled:true, momentum:true, momentumBounce:false, momentumVelocityRatio:0.9 },
      grabCursor: true,
      mousewheel: {
        enabled: true,
        forceToAxis: true,
        releaseOnEdges: true,
        sensitivity: 0.35,
        thresholdDelta: 12,
        thresholdTime: 40,
        eventsTarget: '.cons-swiper'
      },
      preventClicks: true,
      preventClicksPropagation: true,
      passiveListeners: true,
      updateOnWindowResize: true,
      on: {
        touchStart(){ setDragging(true); },
        sliderFirstMove(){ setDragging(true); },
        touchEnd(){ setDragging(false); },
        transitionEnd(){ /* no-op */ },
      },
      breakpoints: {
        1440:{ spaceBetween: 90 },
        1280:{ spaceBetween: 72 },
        1024:{ spaceBetween: 56 },
        768: { spaceBetween: 32 },
        480: { spaceBetween: 24 }
      }
    });

    // 성능 힌트(이미지/카드에 will-change 부여)
    $$('.sec-3 .cons-img, .sec-3 .cons-list').forEach(el => { el.style.willChange = 'transform'; });

    // 섹션4
    new Swiper('.sec-4 .review-menu', {
      direction: 'horizontal',
      slidesPerView: 'auto',
      spaceBetween: 20,
      loop: false,
      navigation: { nextEl: '.rv-nav-topright .rv-next', prevEl: '.rv-nav-topright .rv-prev' },
      grabCursor: true,
      preventClicks: true,
      preventClicksPropagation: true,
    });
  })();

  // ─────────────────────────────────────
  // 3) 섹션3 커스텀 커서 (사라짐/반전 문제 해결)
  //    - 이미지 위에서 흰색 반전: .invert 클래스로 filter 토글
  //    - mix-blend-mode 사용 안 함(일부 배경에서 안 보여 보이는 문제 방지)
  // ─────────────────────────────────────
  // 섹션3 커스텀 커서 부분만 수정/교체
  (function initCustomCursor(){
    const sec3   = document.querySelector('.sec-3');
    const cursor = document.querySelector('.custom-cursor');
    if (!sec3 || !cursor) return;

    let x = -9999, y = -9999;
    let rafId = null, pending = false;
    let wasInside = false;
    let rect = sec3.getBoundingClientRect();

    const recalc = () => { rect = sec3.getBoundingClientRect(); };
    const flush  = () => {
      rafId = null;
      if (!pending) return;
      pending = false;

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      const inside = (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
      if (inside !== wasInside) {
        wasInside = inside;
        if (inside) {
          cursor.classList.add('show');
          document.body.classList.add('use-custom-cursor');   // ✅ 전역 숨김 ON
        } else {
          cursor.classList.remove('show','invert');
          document.body.classList.remove('use-custom-cursor'); // ✅ 전역 숨김 OFF
        }
      }
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(flush); };

    document.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY; pending = true; schedule();
    }, { passive:true });

    // 이미지 위에서만 반전
    document.querySelectorAll('.sec-3 .cons-img-box').forEach(box => {
      box.addEventListener('pointerenter', () => cursor.classList.add('invert'));
      box.addEventListener('pointerleave', () => cursor.classList.remove('invert'));
    });

    window.addEventListener('resize', recalc, { passive:true });
    window.addEventListener('scroll',  recalc, { passive:true });
  })();

  // ─────────────────────────────────────
  // 4) 섹션 페이징 스크롤 (휠/터치/키보드)
  //    - 드래그 중에는 페이징 비활성화
  //    - 휠/터치 입력 1회당 정확히 1스텝만 이동(푸터→위로 갈 때 섹션5 건너뛰는 현상 방지)
  // ─────────────────────────────────────
  (function initSectionPaging(){
    const sections = $$('.sec');
    if (!sections.length) return;

    let offsets = [];
    const calcOffsets = () => { offsets = sections.map(el => Math.round(el.getBoundingClientRect().top + window.scrollY)); };
    calcOffsets();

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(calcOffsets);
      sections.forEach(s => ro.observe(s));
    }
    window.addEventListener('load',  calcOffsets);
    window.addEventListener('resize', calcOffsets);

    const nearestIndex = () => {
      const y = window.scrollY;
      let idx = 0, min = Infinity;
      for (let i=0;i<offsets.length;i++){
        const d = Math.abs(offsets[i]-y);
        if (d < min) { min = d; idx = i; }
      }
      return idx;
    };

    let pagingLocked = false;
    let lastStepAt = 0;     // 입력 디바운스 타임스탬프
    const PAGING_DURATION = 900;   // 스냅 시간 가늠(부드러운 스크롤)
    const DEBOUNCE_MS     = 420;   // 추가 입력 무시(연속 스킵 방지)

    const lockPaging = () => {
      pagingLocked = true;
      setTimeout(() => { pagingLocked = false; }, PAGING_DURATION);
    };

    const scrollToIndex = (i) => {
      i = Math.max(0, Math.min(sections.length-1, i));
      const top = offsets[i];
      lockPaging();
      window.scrollTo({ top, behavior:'smooth' });
    };

    // 스와이퍼 영역 안에 있는지
    const inConsSwiper = (t) => !!(t && (t.closest?.('.cons-swiper')));

    // 공통: 다음/이전 섹션으로 1스텝만 이동
    const step = (dir/*1 or -1*/) => {
      const now = performance.now();
      if (pagingLocked) return;
      if (now - lastStepAt < DEBOUNCE_MS) return;  // 연속 입력 억제
      lastStepAt = now;

      const cur = nearestIndex();
      const next = cur + (dir > 0 ? 1 : -1);
      if (next !== cur) scrollToIndex(next);
    };

    // 휠
    const onWheel = (e) => {
      if (isDraggingSwiper) return;              // ★ 드래그 중 페이징 차단
      if (inConsSwiper(e.target) && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const dy = e.deltaY;
      if (Math.abs(dy) < 10) return;
      e.preventDefault();
      step(dy > 0 ? 1 : -1);
    };

    // 터치
    let touchStartY = null, touchStartX = null;
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      if (touchStartY == null) return;
      const t = e.changedTouches[0];
      const dy = t.clientY - touchStartY;
      const dx = t.clientX - touchStartX;
      touchStartY = touchStartX = null;

      if (isDraggingSwiper) return;              // ★ 드래그 중 페이징 차단
      if (inConsSwiper(e.target) && Math.abs(dx) > Math.abs(dy)) return;

      const TH = 60;
      if (Math.abs(dy) < TH) return;
      step(dy < 0 ? 1 : -1); // 위→아래 스와이프는 다음 섹션
    };

    // 키보드
    const onKeyDown = (e) => {
      if (pagingLocked) return;
      const nextKeys = ['ArrowDown','PageDown','Space'];
      const prevKeys = ['ArrowUp','PageUp'];
      if (![...nextKeys,...prevKeys].includes(e.code)) return;

      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/(INPUT|TEXTAREA|SELECT)/.test(tag)) return;

      e.preventDefault();
      step(nextKeys.includes(e.code) ? 1 : -1);
    };

    window.addEventListener('wheel',      onWheel,     { passive:false });
    window.addEventListener('touchstart', onTouchStart,{ passive:true  });
    window.addEventListener('touchend',   onTouchEnd,  { passive:false });
    window.addEventListener('keydown',    onKeyDown);
  })();
});