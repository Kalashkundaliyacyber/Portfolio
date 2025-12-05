// assets/js/scroll-nav.js
// Improved scroll-driven navigation: reliable up-navigation, snappier down-navigation,
// and wheel/touch support for short/no-scroll pages.
(() => {
  // CONFIG (tweakable)
  const BOTTOM_THRESHOLD = 0.94;   // fraction (fraction of scrollable area) considered "bottom"
  const TOP_THRESHOLD = 0.06;      // fraction considered "top"
  const NAV_DEBOUNCE_MS = 350;     // minimum ms between navigations
  const HOLD_MS = 120;             // require staying at threshold for this long
  const NAV_SELECTOR = '#navbar a';// collect nav links order from navbar
  const IGNORE_BODY_ATTR = 'data-scroll-nav'; // set data-scroll-nav="off" on <body> to disable
  const WHEEL_DELTA_MIN = 28;      // minimum wheel delta threshold to count as intent
  const TOUCH_SWIPE_MIN = 50;      // min vertical px swipe to count as intent

  // Special: portfolio child pages that should route up->services and down->Contact
  // Use the actual filenames/last path segments of your child pages here if they differ.
  const PORTFOLIO_CHILDREN = [
    'certification.html',
    'tryhackme.html',
    'project.html',
    'internship.html'
  ];

  // state
  let lastY = window.scrollY || 0;
  let lastDirection = 0; // 1 down, -1 up, 0 initial
  let lastNavTime = 0;
  let holdTimer = null;
  let navigating = false;
  let enabled = true;
  let ticking = false;
  let touchStartY = null;

  // utilities
  function pageDisabled() {
    const b = document.body;
    if (!b) return false;
    const val = b.getAttribute(IGNORE_BODY_ATTR);
    return !!(val && val.toLowerCase() === 'off');
  }

  // Collect nav hrefs (strings)
  function collectNavOrder() {
    const nodes = Array.from(document.querySelectorAll(NAV_SELECTOR || ''));
    const pages = nodes
      .map(a => ({ href: (a.getAttribute('href') || '').trim(), el: a }))
      .filter(x => x && x.href && !x.href.startsWith('#') && x.href !== '')
      .reduce((acc, cur) => {
        if (!acc.some(p => p.href === cur.href)) acc.push(cur);
        return acc;
      }, [])
      .map(p => p.href);
    return pages;
  }

  // find index within pages (top-level nav) for current location
  function findCurrentIndex(pages) {
    const loc = window.location;
    const cur = loc.pathname.split('/').pop() || 'index.html';
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i].split('/').pop();
      if (p === cur) return i;
    }
    for (let i = 0; i < pages.length; i++) {
      try {
        const url = new URL(pages[i], loc.href);
        if (loc.pathname.endsWith(url.pathname)) return i;
      } catch (e) {}
    }
    return -1;
  }

  function safeNavigate(href) {
    if (!href) return;
    const now = Date.now();
    if (navigating) return;
    if (now - lastNavTime < NAV_DEBOUNCE_MS) return;
    try {
      const target = new URL(href, location.href);
      if (target.href === location.href) return;
    } catch (e) {}
    navigating = true;
    lastNavTime = now;
    // slight delay to allow scroll momentum to settle (keeps UX smooth)
    setTimeout(() => {
      location.assign(href);
    }, 45);
  }

  // hold logic
  function holdThenNavigate(href) {
    if (holdTimer) return;
    holdTimer = setTimeout(() => {
      holdTimer = null;
      safeNavigate(href);
    }, HOLD_MS);
  }
  function cancelHold() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  // compute scroll fraction with robust denominator handling
  function computeFraction() {
    const y = window.scrollY || window.pageYOffset || 0;
    const docH = Math.max(document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0);
    const winH = window.innerHeight || document.documentElement.clientHeight || 0;
    const scrollable = Math.max(1, docH - winH); // avoid zero
    const fraction = (y) / scrollable;
    return { fraction, y, docH, winH, scrollable };
  }

  // ---------- Helpers for special Portfolio-child behavior ----------
  function getCurrentPageName() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function isPortfolioChild(curName) {
    // Accept case-insensitive match
    const n = (curName || '').toLowerCase();
    return PORTFOLIO_CHILDREN.some(x => x.toLowerCase() === n || n.includes(x.toLowerCase().replace('.html','')));
  }

  // given pages array, try to locate services/contact hrefs by name fragment
  function findHrefByFragment(pages, fragment) {
    if (!pages || !fragment) return null;
    const frag = fragment.toLowerCase();
    for (let i = 0; i < pages.length; i++) {
      try {
        const p = pages[i];
        const last = (new URL(p, location.href)).pathname.split('/').pop().toLowerCase();
        if (last === frag || last.includes(frag) || p.toLowerCase().includes(`/${frag}`)) return pages[i];
      } catch (e) {
        // fallback to simple substring match
        if (pages[i].toLowerCase().includes(frag)) return pages[i];
      }
    }
    return null;
  }

  // returns { upHref, downHref } for a portfolio child (may be null if not found)
  function getSpecialHrefsForPortfolioChild(pages) {
    // we expect 'services' and 'contact' to exist as top-level nav items
    const upHref = findHrefByFragment(pages, 'services');
    const downHref = findHrefByFragment(pages, 'contact');
    return { upHref, downHref };
  }
  // ---------- end helpers ----------

  // Decide navigation; pages may be short (no-scroll) - handle separately
  function checkAndMaybeNavigate(pages, curIndex, direction, fraction, y, docH, winH, scrollable) {
    if (!enabled) return;
    if (pageDisabled()) return;
    if (!pages || pages.length < 2) return;

    // avoid if user typing or in editing context
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

    // If page has little or no scrollable content (docH <= winH), use wheel/touch navigation instead.
    const noScrollPage = (docH <= winH + 2);

    // If current page is one of the portfolio children, map up/down to services/Contact instead:
    const curName = getCurrentPageName();
    const isChild = isPortfolioChild(curName);
    if (isChild) {
      const special = getSpecialHrefsForPortfolioChild(pages);
      // SCROLL-BASED NAVIGATION (when scrollable)
      if (!noScrollPage) {
        if (direction > 0 && fraction >= BOTTOM_THRESHOLD) {
          // scrolling down and near bottom -> go to Contact (downHref) if available
          if (special.downHref) holdThenNavigate(special.downHref);
        } else if (direction < 0 && fraction <= TOP_THRESHOLD) {
          // scrolling up and near top -> go to services (upHref) if available
          if (special.upHref) holdThenNavigate(special.upHref);
        } else {
          cancelHold();
        }
        return;
      }
      // noScrollPage: touch/wheel handlers will handle immediate navigation
      return;
    }

    // SCROLL-BASED NAVIGATION (normal pages)
    if (!noScrollPage) {
      if (direction > 0 && fraction >= BOTTOM_THRESHOLD) {
        // scrolling down and near bottom -> next page if exists
        if (curIndex >= 0 && curIndex < pages.length - 1) holdThenNavigate(pages[curIndex + 1]);
      } else if (direction < 0 && fraction <= TOP_THRESHOLD) {
        // scrolling up and near top -> previous page if exists
        if (curIndex > 0) holdThenNavigate(pages[curIndex - 1]);
      } else {
        // moved away from thresholds
        cancelHold();
      }
      return;
    }

    // NO-SCROLL PAGE: nothing to scroll, use wheel/touch gestures handled elsewhere
  }

  // scroll handler (throttled via RAF)
  function onScrollFactory(pages, curIndexGetter) {
    return function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { fraction, y, docH, winH, scrollable } = computeFraction();
          const direction = (y > lastY) ? 1 : (y < lastY) ? -1 : lastDirection;
          // if direction changed cancel any pending hold
          if (direction !== lastDirection) cancelHold();
          const curIndex = curIndexGetter();
          checkAndMaybeNavigate(pages, curIndex, direction, fraction, y, docH, winH, scrollable);
          lastY = y;
          lastDirection = direction;
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  // WHEEL handler for short/no-scroll pages AND as a faster alternative for all pages
  // NOTE: changed to compute fraction and use fraction comparisons for nearTop/nearBottom
  function onWheelFactory(pages, curIndexGetter) {
    let wheelTimeout = null;
    return function onWheel(e) {
      if (!enabled || pageDisabled()) return;
      // ignore if user typing
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      // respect small touchpads generating tiny deltas
      const delta = e.deltaY || e.wheelDelta || -e.detail || 0;
      // normalize sign: positive delta -> scroll down
      const abs = Math.abs(delta);

      // If delta is too small, ignore
      if (abs < WHEEL_DELTA_MIN) return;

      // If page is scrollable and user is not at top/bottom thresholds, do nothing (let natural scroll)
      const { fraction, y, docH, winH, scrollable } = computeFraction();
      const noScrollPage = (docH <= winH + 2);

      // Use fraction for nearTop/nearBottom (consistent with scroll handler)
      const nearBottom = (fraction >= BOTTOM_THRESHOLD);
      const nearTop = (fraction <= TOP_THRESHOLD);

      const direction = delta > 0 ? 1 : -1;
      const curIndex = curIndexGetter();

      // Check for portfolio child special case:
      const curName = getCurrentPageName();
      if (isPortfolioChild(curName)) {
        const special = getSpecialHrefsForPortfolioChild(pages);
        if (noScrollPage) {
          if (direction > 0 && special.downHref) {
            safeNavigate(special.downHref);
          } else if (direction < 0 && special.upHref) {
            safeNavigate(special.upHref);
          }
          return;
        } else {
          // scrollable page: allow wheel to trigger if near edges (same as normal behavior)
          if (direction > 0 && nearBottom && special.downHref) {
            safeNavigate(special.downHref);
            return;
          } else if (direction < 0 && nearTop && special.upHref) {
            safeNavigate(special.upHref);
            return;
          } else {
            cancelHold();
            return;
          }
        }
      }

      // For normal pages:
      if (noScrollPage) {
        // immediate navigation on intent for no-scroll pages
        if (direction > 0 && curIndex < pages.length - 1) {
          safeNavigate(pages[curIndex + 1]);
        } else if (direction < 0 && curIndex > 0) {
          safeNavigate(pages[curIndex - 1]);
        }
        return;
      }

      // For scrollable pages: allow wheel to trigger if near edges (so nav is snappy)
      if (direction > 0 && nearBottom && curIndex < pages.length - 1) {
        safeNavigate(pages[curIndex + 1]);
      } else if (direction < 0 && nearTop && curIndex > 0) {
        safeNavigate(pages[curIndex - 1]);
      } else {
        // If not near edges, do nothing; but still cancel pending hold
        cancelHold();
      }

      // small debounce to prevent double-handling
      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 120);
    };
  }

  // TOUCH handlers for mobile swipes (for no-scroll pages or for fast navigation)
  function setupTouchHandlers(pages, curIndexGetter) {
    document.addEventListener('touchstart', (e) => {
      if (!enabled || pageDisabled()) return;
      if (!e.touches || e.touches.length === 0) return;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!enabled || pageDisabled()) return;
      if (touchStartY === null) return;
      const touch = (e.changedTouches && e.changedTouches[0]) || null;
      if (!touch) { touchStartY = null; return; }
      const dy = touchStartY - touch.clientY; // positive = swipe up (want next page)
      touchStartY = null;

      if (Math.abs(dy) < TOUCH_SWIPE_MIN) return;

      const curIndex = curIndexGetter();
      const curName = getCurrentPageName();
      if (isPortfolioChild(curName)) {
        const special = getSpecialHrefsForPortfolioChild(pages);
        if (dy > 0) {
          // swipe up -> next (Contact)
          if (special.downHref) safeNavigate(special.downHref);
        } else {
          // swipe down -> prev (services)
          if (special.upHref) safeNavigate(special.upHref);
        }
        return;
      }

      if (dy > 0) {
        // swipe up -> next
        if (curIndex >= 0 && curIndex < pages.length - 1) safeNavigate(pages[curIndex + 1]);
      } else {
        // swipe down -> prev
        if (curIndex > 0) safeNavigate(pages[curIndex - 1]);
      }
    }, { passive: true });
  }

  // Keyboard toggle for testing
  function setupKeyboardToggle() {
    document.addEventListener('keydown', (e) => {
      if (e.key && (e.key === 's' || e.key === 'S')) {
        enabled = !enabled;
        flashMessage(enabled ? 'Scroll-nav enabled' : 'Scroll-nav disabled');
      }
    });
  }

  // small toast for debugging messages
  let flashEl = null;
  function flashMessage(text) {
    if (!document.body) return;
    if (!flashEl) {
      flashEl = document.createElement('div');
      Object.assign(flashEl.style, {
        position: 'fixed',
        left: '50%',
        top: '16px',
        transform: 'translateX(-50%)',
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        borderRadius: '6px',
        zIndex: 999999,
        fontSize: '13px',
        pointerEvents: 'none',
        transition: 'opacity 260ms'
      });
      document.body.appendChild(flashEl);
    }
    flashEl.textContent = text;
    flashEl.style.opacity = '1';
    setTimeout(() => { if (flashEl) flashEl.style.opacity = '0'; }, 1000);
  }

  // ENTRY: wire listeners after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    if (pageDisabled()) return;

    const pages = collectNavOrder();
    if (!pages || pages.length < 2) return;

    const curIndexGetter = () => findCurrentIndex(pages);

    // listeners
    const onScroll = onScrollFactory(pages, curIndexGetter);
    window.addEventListener('scroll', onScroll, { passive: true });

    // wheel: listen non-passive? we use passive: true for compatibility; logic doesn't prevent default
    window.addEventListener('wheel', onWheelFactory(pages, curIndexGetter), { passive: true });

    // touch swipes
    setupTouchHandlers(pages, curIndexGetter);

    // extra defensive handlers
    window.addEventListener('resize', cancelHold);
    document.addEventListener('touchstart', cancelHold, { passive: true });

    // keyboard toggle
    setupKeyboardToggle();

    // expose API for debugging
    window.__scrollNav = {
      enable: () => { enabled = true; flashMessage('Scroll-nav enabled'); },
      disable: () => { enabled = false; flashMessage('Scroll-nav disabled'); },
      isEnabled: () => enabled
    };
  });
})();
