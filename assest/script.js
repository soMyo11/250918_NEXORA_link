AOS.init({
    once: true // ❗ 한 번만 실행
});

// ==============================
// NEXORA - script.js (이슈 3건 반영 전면 교체본)
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    const $  = (s, c=document) => c.querySelector(s);
    const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

// ─────────────────────────────────────
// SECTION 1 (ScrollTrigger)
// ─────────────────────────────────────
    (function initSection1_ST(){
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const sec1    = document.querySelector('#sec-1');
    const line    = document.querySelector('.center-line');
    const reveal  = document.querySelector('.video-reveal');
    const videoEl = document.querySelector('.hero-video');
    if (!sec1 || !line || !reveal || !videoEl) return;

    gsap.set(line,   { visibility:'hidden', opacity:0, scaleY:0, transformOrigin:'top center' });
    gsap.set(reveal, { opacity:1, '--gap':'50%' });

    const tl = gsap.timeline({ paused:true, defaults:{ immediateRender:false } });

    tl
        .set(line, { visibility:'visible', opacity:1 })
        .to(line,  { scaleY:1, duration:1.2, ease:'power3.out' }, 0)
        .addLabel('reveal')
        .set(line, { opacity:0, visibility:'hidden' }, 'reveal')
        .to(reveal, { '--gap':'0%', duration:1.0, ease:'power3.inOut' }, 'reveal')

         // ★ 헤더 노출 콜백 추가 (여기!)
        .call(() => {
            const header = document.querySelector('header');
            if (!header) return;

            // 1) 강제 노출
            header.classList.remove('is-hidden');
            header.classList.add('force-show');

            // 2) 섹션1 자동숨김 잠깐 끄기
            window.__sec1HeaderAutoHide = false;

            // 3) 인트로 끝난 뒤 원복
            setTimeout(() => {
            header.classList.remove('force-show');
            window.__sec1HeaderAutoHide = true;
            }, 2600); // 텍스트/라인 애니 끝난 뒤 타이밍
        }, [], 'reveal+=1.18')

        // 순서: 첫 문장 → 라인 → 두 번째 문장
        .call(() => { document.querySelector('.vt-1')?.classList.add('is-show'); }, [], 'reveal+=1.2')
        .call(() => { document.querySelector('.v-line-wrap')?.classList.add('is-drawing'); }, [], 'reveal+=1.8')
        .call(() => { document.querySelector('.vt-2')?.classList.add('is-show'); }, [], 'reveal+=3.0');

    // ★ 누락됐던 부분: 변수와 함수 정의
    let revealedOnce = false;
    const playVideoSmooth = () => {
        requestAnimationFrame(() => {
        requestAnimationFrame(() => { videoEl.play().catch(()=>{}); });
        });
    };

    ScrollTrigger.create({
        trigger: sec1,
        start: 'top bottom',   // 섹션 상단이 뷰포트 하단에 닿으면 활성화
        end:   'bottom top',   // 섹션 하단이 뷰포트 상단을 지나면 비활성화
        onToggle: (self) => {
            if (self.isActive) {
            // 섹션1이 화면 안에 있을 때
            if (!revealedOnce) {
                if (videoEl.readyState >= 2) { tl.play(0); revealedOnce = true; }
                else {
                const onReady = () => { tl.play(0); revealedOnce = true; videoEl.removeEventListener('canplay', onReady); };
                videoEl.addEventListener('canplay', onReady, { once:true });
                }
            }
            // 비디오 재생 (2프레임 뒤에 호출해 재생 실패 방지)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { videoEl.play().catch(()=>{}); });
            });
            } else {
            // 섹션1이 화면을 벗어났을 때만 일시정지
            try { videoEl.pause(); } catch(_) {}
            }
        }
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
    // 3) 섹션3 커스텀 커서 (+ 헤더 위에선 숨김)
    // ─────────────────────────────────────
    (function initCustomCursor(){
    const sec3   = document.querySelector('.sec-3');
    const cursor = document.querySelector('.custom-cursor');
    const header = document.querySelector('header');
    if (!sec3 || !cursor || !header) return;

    let x = -9999, y = -9999;
    let rafId = null, pending = false;
    let wasInside = false;
    let secRect = sec3.getBoundingClientRect();

    const recalc = () => { secRect = sec3.getBoundingClientRect(); };

    const flush  = () => {
        rafId = null;
        if (!pending) return;
        pending = false;

        cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

        const elAt = document.elementFromPoint(x, y);
        const overHeader = !!(elAt && elAt.closest && elAt.closest('header'));
        if (overHeader) {
        cursor.classList.add('hidden');
        cursor.classList.remove('show','invert');
        wasInside = false;      // 헤더에서 내려올 때 즉시 복구되도록 리셋
        return;                 // 아래 로직 진행하지 않음
        } else {
        cursor.classList.remove('hidden'); // 헤더에서 벗어나면 다시 보이게
        }

        // sec-3 범위 안/밖 판정
        const inside = (x >= secRect.left && x <= secRect.right && y >= secRect.top && y <= secRect.bottom);
        if (inside !== wasInside) {
        wasInside = inside;
        if (inside) {
            cursor.classList.add('show');
        } else {
            cursor.classList.remove('show','invert');
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
      // ★ 브라우저 줌(CTRL/⌘ + 휠)은 그냥 통과시켜야 함
      if (e.ctrlKey || e.metaKey) return;

      if (isDraggingSwiper) return;
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
      // ★ 브라우저/OS 단축키는 통과
      if (e.ctrlKey || e.metaKey) return;

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

// ==============================
// Header theme & show/hide (conflict-free)
// ==============================
(function initHeaderMinimal(){
    const header = document.querySelector('header');
    if (!header) return;
     // 초기엔 숨겨두고(스크롤/호버/리빌이 보여줌)
    header.classList.add('is-hidden');

     // 1섹션에서도 자동 숨김을 허용하는 플래그
     // (호버존에서 빠져나오면 사라지길 원하므로 기본 true)
    window.__sec1HeaderAutoHide = true;

    // 1) 뷰포트 중앙에 걸린 섹션을 찾아서 인덱스 반환
    const getCurrentSectionIndex = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const el = document.elementFromPoint(centerX, centerY);
    const sec = el && el.closest ? el.closest('.sec') : null;
    if (!sec) return 0;
    const list = Array.from(document.querySelectorAll('.sec'));
    const idx = list.indexOf(sec);
    return Math.max(0, idx);
    };

    // 2) 섹션 테마 규칙
    // - 섹션 2,4: 로고 흰색
    // - 섹션 3,4: 메뉴 글자 검정 + 보더 연회색
    const applyThemeForSection = (idx) => {
    // 초기화
    header.classList.remove('logo-white', 'menu-dark');

    // 로고 흰색: 1,3
    if (idx === 1 || idx === 3) header.classList.add('logo-white');

    // 메뉴/보더 다크: 2,4
    if (idx === 2 || idx === 4) header.classList.add('menu-dark');
    };

    // 3) 스크롤 방향에 따라 헤더 숨김/표시
    let lastY = window.scrollY;
    let ticking = false;

    const updateOnScroll = () => {
    ticking = false;

    const y = window.scrollY;
    const goingDown = y > lastY + 2;
    const goingUp   = y < lastY - 2;

    const curIdx = getCurrentSectionIndex();

    // 섹션 테마 갱신
    applyThemeForSection(curIdx);

    // 요구사항: 섹션1이라도 호버존에서 내려왔으면 사라지도록 허용
    if (curIdx > 0 || window.__sec1HeaderAutoHide) {
        if (goingDown) header.classList.add('is-hidden');
        else if (goingUp) header.classList.remove('is-hidden');
    } else {
        header.classList.remove('is-hidden');
    }

    lastY = y;
    };

    window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
    }, { passive:true });

    window.addEventListener('resize', () => {
    requestAnimationFrame(() => applyThemeForSection(getCurrentSectionIndex()));
    }, { passive:true });

    // 4) 상단 100px 호버 시 강제 표시
    const hoverZone = document.createElement('div');
    hoverZone.className = 'top-hover-zone';
    document.body.appendChild(hoverZone);

    // 상단 100px 안에 마우스가 들어오면 헤더 강제 표시
(function attachHeaderHoverByMouseY(){
    const header = document.querySelector('header');
    if (!header) return;

    let forced = false;
    window.addEventListener('mousemove', (e) => {
    if (e.clientY <= 100) {
        if (!forced) {
        forced = true;
        header.classList.add('force-show');
        header.classList.remove('is-hidden');
        }
    } else if (forced) {
        forced = false;
        header.classList.remove('force-show');

        const centerEl = document.elementFromPoint(innerWidth/2, innerHeight/2);
        const curSec = centerEl && centerEl.closest('.sec');
        const list = Array.from(document.querySelectorAll('.sec'));
        const idx = Math.max(0, list.indexOf(curSec));

        // 요구사항: 1섹션이어도 호버존에서 내려오면 숨김
        if ((idx > 0 && window.scrollY > 0) || (idx === 0 && window.__sec1HeaderAutoHide)) {
            header.classList.add('is-hidden');
        }
    }
    }, { passive:true });
})();


// ==============================
// 팝업창
// ==============================

// 첫 로드 테마 1회 적용
applyThemeForSection(getCurrentSectionIndex());
})();

// 공통 열기 함수
function openComingSoon() {
    const modal = document.getElementById('csModal');
    if (!modal) return;

    // 스크롤 잠금
    document.documentElement.classList.add('body-lock');

    // 포커스 관리
    const previouslyFocused = document.activeElement;
    modal.dataset.prev = previouslyFocused ? previouslyFocused.className || previouslyFocused.id || '1' : '';

    modal.classList.add('is-open');
    // 첫 포커스 대상
    const focusable = modal.querySelector('.btn,[data-close]');
    if (focusable) focusable.focus();

    // ESC 닫기
    const onKey = (e) => { if (e.key === 'Escape') closeComingSoon(); };
    modal._onKey = onKey;
    document.addEventListener('keydown', onKey, { once: true });
}

// 공통 닫기 함수
function closeComingSoon() {
    const modal = document.getElementById('csModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('body-lock');

    // 포커스 복귀 (간단 복귀)
    const prev = modal.dataset.prev;
    if (prev) { try { document.querySelector('.' + prev)?.focus(); } catch(_){} }
}

// 트리거: .coming-soon 링크 모두 모달로 전환
document.addEventListener('click', (e) => {
    const t = e.target.closest('.coming-soon');
    if (!t) return;
    e.preventDefault();
    openComingSoon();
});

// 닫기 버튼/배경 클릭
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) {
    closeComingSoon();
    }
});