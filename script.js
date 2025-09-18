// GSAP(섹션2 영상 리빌 & 재시작) + Swiper(가로 드래그/휠) + 커스텀 커서(히트테스트)
document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const videoEl = document.querySelector('.hero-video');

    // 1) 리빌 타임라인: 항상 0에서 시작하도록 paused로 구성
    const revealTl = gsap.timeline({ paused: true });

    // 초기 상태 세팅(안전)
    revealTl.set('.center-line',  { scaleY: 0, opacity: 1, transformOrigin: 'center center' })
            .set('.video-reveal', { opacity: 0, '--gap': '50%' });

    // 라인 → 비디오 페이드인 → 좌우 확장 → 라인 페이드아웃
    revealTl
      .to('.center-line', {
        scaleY: 1,
        duration: 1.8,
        ease: 'power3.inOut'
      })
      .to('.video-reveal', {
        opacity: 1,
        duration: 0.25,
        ease: 'power1.out'
      }, '-=0.6')
      .to('.video-reveal', {
        '--gap': '0%',
        duration: 1.2,
        ease: 'power3.inOut'
      }, '-=0.05')
      .to('.center-line', {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.6');

    // 2) 섹션 가시성에 따라 타임라인/영상 제어
    ScrollTrigger.create({
      trigger: '#sec-2',
      start: 'top 100%',
      end: 'bottom',

      onEnter: () => {
        // 라인 등장부터 다시
        revealTl.restart(true, false);
        if (videoEl) { videoEl.currentTime = 0; videoEl.play().catch(()=>{}); }
      },
      onEnterBack: () => {
        revealTl.restart(true, false);
        if (videoEl) { videoEl.currentTime = 0; videoEl.play().catch(()=>{}); }
      },

      onLeave: () => {
        // 화면을 벗어나면 정지 + 상태 초기화(다음 입장 때 라인부터)
        revealTl.pause(0); // 타임라인을 0으로 되감아 둠
        if (videoEl) videoEl.pause();
      },
      onLeaveBack: () => {
        revealTl.pause(0);
        if (videoEl) videoEl.pause();
      }
    });
  }
  // ─────────────────────────────────────
  // 1) Swiper (좌우 드래그/휠)
  // ─────────────────────────────────────
  const consSwiper = new Swiper('.cons-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 105,
    centeredSlides: false,
    watchOverflow: true,
    simulateTouch: true,
    threshold: 10,
    touchRatio: 1,
    freeMode: { enabled: true, momentum: true, momentumBounce: false },
    mousewheel: {
      enabled: true, forceToAxis: true, releaseOnEdges: true,
      sensitivity: 0.3, thresholdDelta: 10, thresholdTime: 40,
      eventsTarget: '.cons-swiper'
    },
    breakpoints: {
      1440: { spaceBetween: 90 },
      1280: { spaceBetween: 72 },
      1024: { spaceBetween: 56 },
      768:  { spaceBetween: 32 },
      480:  { spaceBetween: 24 }
    }
  });

  // ─────────────────────────────────────
  // 2) 커스텀 커서 (히트테스트 기반)
  // ─────────────────────────────────────
  const sec3 = document.querySelector('.sec-3');
  const cursor = document.querySelector('.custom-cursor');
  if (sec3 && cursor) {
    let x = -9999, y = -9999;
    let rafId = null;
    let pending = false;
    let wasInside = false;

    function flush() {
      rafId = null;
      if (!pending) return;
      pending = false;

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      const r = sec3.getBoundingClientRect();
      const inside = (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);

      if (inside !== wasInside) {
        wasInside = inside;
        if (inside) { cursor.classList.add('show'); document.body.style.cursor = 'none'; }
        else { cursor.classList.remove('show', 'invert'); document.body.style.cursor = 'auto'; }
      }
    }
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(flush); };

    const moveEvt = ('onpointerrawupdate' in window) ? 'pointerrawupdate' : 'pointermove';
    document.addEventListener(moveEvt, (e) => {
      x = e.clientX; y = e.clientY; pending = true; schedule();
    }, { passive: true });

    sec3.addEventListener('pointerover', (e) => {
      if (e.target.closest('.cons-img-box')) cursor.classList.add('invert');
    });
    sec3.addEventListener('pointerout', (e) => {
      if (e.target.closest('.cons-img-box')) cursor.classList.remove('invert');
    });

    window.addEventListener('resize', () => { pending = true; schedule(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = null; }
      else if (!document.hidden && !rafId && pending) { rafId = requestAnimationFrame(flush); }
    });
  }
});

  // ─────────────────────────────────────
  // sec-4 스와이퍼
  // ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new Swiper('.sec-4 .review-menu', {
    direction: 'horizontal',   // 가로 스와이프
    slidesPerView: 'auto',     // 각 슬라이드 width(600px)를 기준으로 자동 배치
    spaceBetween: 20,          // 슬라이드 간격
    loop: false,               // 필요 시 true
    navigation: {
      nextEl: '.rv-nav-topright .rv-next',
      prevEl: '.rv-nav-topright .rv-prev',
    },
  });
});


// ─────────────────────────────────────
// 섹션 페이징 스크롤 (휠/터치/키보드)
// ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const sections = Array.from(document.querySelectorAll('.sec'));
  if (sections.length === 0) return;

  // 섹션 Y좌표 캐시
  let offsets = [];
  const calcOffsets = () => {
    offsets = sections.map(el => Math.round(el.getBoundingClientRect().top + window.scrollY));
  };
  calcOffsets();

  // 리사이즈/폰트로드 등 레이아웃 변동 대응
  let ro;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => calcOffsets());
    sections.forEach(s => ro.observe(s));
  }
  window.addEventListener('load', calcOffsets);
  window.addEventListener('resize', () => { calcOffsets(); });

  // 현재 섹션 index 찾기
  const nearestIndex = () => {
    const y = window.scrollY;
    let idx = 0;
    let min = Infinity;
    for (let i = 0; i < offsets.length; i++) {
      const d = Math.abs(offsets[i] - y);
      if (d < min) { min = d; idx = i; }
    }
    return idx;
  };

  // 스크롤 잠금(중복 입력 방지)
  let locked = false;
  const duration = 700; // ms: 이동 시간
  const lock = () => { locked = true; setTimeout(() => locked = false, duration + 80); };

  // 가로 스와이퍼 영역에서는 수평 스크롤은 통과, 수직만 페이징
  const isInsideHorizontalSwiper = (evtTarget) => {
    return !!(evtTarget && (evtTarget.closest?.('.cons-swiper')));
  };

  const scrollToIndex = (i) => {
    i = Math.max(0, Math.min(sections.length - 1, i));
    const top = offsets[i];
    lock();
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // 휠
  const onWheel = (e) => {
    if (locked) { e.preventDefault(); return; }

    // 스와이퍼 안에서 가로 휠(shift+wheel 등) → 통과
    if (isInsideHorizontalSwiper(e.target) && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    const delta = e.deltaY;
    if (Math.abs(delta) < 10) return; // 미세 스크롤 무시

    e.preventDefault(); // 기본 스크롤 막고
    const cur = nearestIndex();
    const next = (delta > 0) ? cur + 1 : cur - 1;
    if (next !== cur) scrollToIndex(next);
  };

  // 터치(모바일 스와이프)
  let touchStartY = null;
  let touchStartX = null;
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

    // 스와이퍼 안에서 가로 스와이프는 통과
    if (isInsideHorizontalSwiper(e.target) && Math.abs(dx) > Math.abs(dy)) return;
    if (locked) return;

    const threshold = 60; // 최소 스와이프 거리
    if (Math.abs(dy) < threshold) return;

    const cur = nearestIndex();
    const next = (dy < 0) ? cur + 1 : cur - 1; // 위→아래 스와이프는 다음 섹션
    if (next !== cur) {
      e.preventDefault();
      scrollToIndex(next);
    }
  };

  // 키보드(상/하, PgUp/PgDn, Space)
  const onKeyDown = (e) => {
    if (locked) return;
    const keysNext = ['ArrowDown', 'PageDown', 'Space'];
    const keysPrev = ['ArrowUp', 'PageUp'];
    if (![...keysNext, ...keysPrev].includes(e.code)) return;

    // 입력 폼(인풋/텍스트에어리아/셀렉트) 포커스 시 무시
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/(INPUT|TEXTAREA|SELECT)/.test(tag)) return;

    e.preventDefault();
    const cur = nearestIndex();
    const next = keysNext.includes(e.code) ? cur + 1 : cur - 1;
    if (next !== cur) scrollToIndex(next);
  };

  // 리스너 등록
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: false });
  window.addEventListener('keydown', onKeyDown);

  // 초기 위치가 어중간하면 가까운 섹션에 붙이기(옵션)
  // scrollToIndex(nearestIndex());
});