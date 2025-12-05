/**
 * Template Name: Kelly
 * Template URL: https://bootstrapmade.com/kelly-free-bootstrap-cv-resume-html-template/
 * Updated: Mar 17 2024 with Bootstrap v5.3.3
 * Author: BootstrapMade.com
 * License: https://bootstrapmade.com/license/
 */

(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim();
    if (all) {
      return [...document.querySelectorAll(el)];
    } else {
      return document.querySelector(el);
    }
  };

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all);
    if (selectEl) {
      if (all) {
        selectEl.forEach((e) => e.addEventListener(type, listener));
      } else {
        selectEl.addEventListener(type, listener);
      }
    }
  };

  /**
   * Easy on scroll event listener
   */
  const onscroll = (el, listener) => {
    el.addEventListener("scroll", listener);
  };

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select("#header");
    let offset = header.offsetHeight;

    let elementPos = select(el).offsetTop;
    window.scrollTo({
      top: elementPos - offset,
      behavior: "smooth",
    });
  };

  /**
   * Back to top button
   */
  let backtotop = select(".back-to-top");
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add("active");
      } else {
        backtotop.classList.remove("active");
      }
    };
    window.addEventListener("load", toggleBacktotop);
    onscroll(document, toggleBacktotop);
  }

  /**
   * Mobile nav toggle
   */
  on("click", ".mobile-nav-toggle", function (e) {
    select("#navbar").classList.toggle("navbar-mobile");
    this.classList.toggle("bi-list");
    this.classList.toggle("bi-x");
  });

  /**
   * Mobile nav dropdowns activate
   */
  on(
    "click",
    ".navbar .dropdown > a",
    function (e) {
      if (select("#navbar").classList.contains("navbar-mobile")) {
        e.preventDefault();
        this.nextElementSibling.classList.toggle("dropdown-active");
      }
    },
    true
  );

  /**
   * Scroll with offset on links with a class name .scrollto
   */
  on(
    "click",
    ".scrollto",
    function (e) {
      if (select(this.hash)) {
        e.preventDefault();

        let navbar = select("#navbar");
        if (navbar.classList.contains("navbar-mobile")) {
          navbar.classList.remove("navbar-mobile");
          let navbarToggle = select(".mobile-nav-toggle");
          navbarToggle.classList.toggle("bi-list");
          navbarToggle.classList.toggle("bi-x");
        }
        scrollto(this.hash);
      }
    },
    true
  );

  /**
   * Scroll with offset on page load with hash links in the url
   */
  window.addEventListener("load", () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash);
      }
    }
  });

  /**
   * Preloader
   */
  let preloader = select("#preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.remove();
    });
  }

  /**
   * Porfolio isotope and filter
   */
  // Portfolio isotope and filter
  window.addEventListener("load", () => {
    let portfolioContainer = select(".portfolio-container");

    if (portfolioContainer) {
      // Determine the default filter based on the current page
      let currentPage = window.location.pathname;
      let defaultFilter = ".filter-cc"; // Default to 'Courses' filter

      // Check the current page and set the default filter accordingly
      if (currentPage.includes("certification.html")) {
        defaultFilter = ".filter-certificate";
      } else if (currentPage.includes("tryhackme.html")) {
        defaultFilter = ".filter-tryhackme";
      } else if (currentPage.includes("project.html")) {
        defaultFilter = ".filter-project";
      } else if (currentPage.includes("internship.html")) {
        defaultFilter = ".filter-Internship";
      }

      // Initialize Isotope with the determined default filter
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: ".portfolio-item",
        layoutMode: "fitRows",
        filter: defaultFilter, // Apply the dynamic default filter
      });

      let portfolioFilters = select("#portfolio-flters li", true);

      on(
        "click",
        "#portfolio-flters li",
        function (e) {
          e.preventDefault(); // Prevent default link behavior

          // Remove the active class from all portfolio filter items
          portfolioFilters.forEach(function (el) {
            el.classList.remove("filter-active");
          });

          // Add the active class to the clicked filter item
          this.classList.add("filter-active");

          // Apply the Isotope filter based on the clicked filter's data-filter value
          portfolioIsotope.arrange({
            filter: this.getAttribute("data-filter"),
          });

          // Refresh AOS animations after filter change
          portfolioIsotope.on("arrangeComplete", function () {
            AOS.refresh();
          });

          // Get the href of the clicked <a> element
          const link = this.querySelector("a");
          if (link) {
            // After applying the filter, navigate to the corresponding page
            window.location.href = link.href;
          }
        },
        true
      );
    }
  });

  /**
   * Initiate portfolio lightbox
   */
  const portfolioLightbox = GLightbox({
    selector: ".portfolio-lightbox",
  });

  /**
   * Initiate portfolio details lightbox
   */
  const portfolioDetailsLightbox = GLightbox({
    selector: ".portfolio-details-lightbox",
    width: "90%",
    height: "90vh",
  });

  /**
   * Portfolio details slider
   */
  new Swiper(".portfolio-details-slider", {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      type: "bullets",
      clickable: true,
    },
  });

  /**
   * Skills animation
   */
  let skilsContent = select(".skills-content");
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: "80%",
      handler: function (direction) {
        let progress = select(".progress .progress-bar", true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute("aria-valuenow") + "%";
        });
      },
    });
  }

  /**
   * Testimonials slider
   */
  new Swiper(".testimonials-slider", {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    slidesPerView: "auto",
    pagination: {
      el: ".swiper-pagination",
      type: "bullets",
      clickable: true,
    },
  });

  /**
   * Animation on scroll
   */
  window.addEventListener("load", () => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  });

 
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

    // SCROLL-BASED NAVIGATION (when scrollable)
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
      const { y, docH, winH, scrollable } = computeFraction();
      const noScrollPage = (docH <= winH + 2);

      // if scrollable and we are not near extremes, don't navigate to avoid accidental nav
      const nearBottom = ((y + winH) >= (docH * BOTTOM_THRESHOLD));
      const nearTop = (y <= docH * TOP_THRESHOLD) || (y <= (scrollable * TOP_THRESHOLD));

      const direction = delta > 0 ? 1 : -1;
      const curIndex = curIndexGetter();

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





  /**
   * Initiate Pure Counter
   */
  new PureCounter();
})();
