// assets/js/music-toggle.js
(() => {
  // -------------------------
  // CONFIG - update if needed
  // -------------------------
  const audioSrc = 'assets/music2.mp3';         // path to your audio file (relative to site root)
  const ICON_PLAY_PATH = 'assets/pause.svg';  // shown when audio is paused (click to play)
  const ICON_PAUSE_PATH = 'assets/resume.svg';  // shown when audio is playing (click to pause)
  const titleSelector = '#title, .site-title, header h1';

  const excludedSelector = [
    '#header',
    '.portfolio-item',
    '.portfolio-wrap',
    '.portfolio-info',
    '.portfolio-links',
    '.portfolio-lightbox',
    '.mobile-nav-toggle',
    '[aria-label="Close"]',
    '#portfolio-flters',
    '#portfolio-flters li',
    '#portfolio-flters a',
    '[data-filter]',
    '.row[data-aos]'
  ].join(', ');

  const volume = 0.6;
  const showIndicator = true;

  // storage keys
  const K_IS_PLAYING = 'bgmusic:isPlaying';
  const K_CURRENT_TIME = 'bgmusic:currentTime';
  const K_HAS_USER_GESTURE = 'bgmusic:hasUserGesture';

  // create audio element programmatically
  const audio = document.createElement('audio');
  audio.id = 'bg-music';
  audio.src = audioSrc;
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = volume;
  audio.setAttribute('aria-hidden', 'true');
  audio.style.display = 'none';
  document.body.appendChild(audio);

  // Remove any existing indicator elements (cleanup old/duplicate scripts)
  (function cleanupOldIndicators() {
    const old = document.getElementById('music-indicator');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const oldImg = document.getElementById('music-indicator-img');
    if (oldImg && oldImg.parentNode) oldImg.parentNode.removeChild(oldImg);
  })();

  // visual indicator (SVG-only, left side)
  let indicator = null;
  let indicatorImg = null;

  if (showIndicator) {
    indicator = document.createElement('button');
    indicator.id = 'music-indicator';
    indicator.type = 'button';
    indicator.setAttribute('aria-pressed', 'false');
    indicator.setAttribute('aria-label', 'Toggle background music');

    Object.assign(indicator.style, {
      position: 'fixed',
      left: '12px',         // left side as requested
      bottom: '12px',
      padding: '6px',
      borderRadius: '10px',
      backdropFilter: 'blur(6px)',
      background: 'rgba(0,0,0,0.35)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      cursor: 'pointer',
      userSelect: 'none'
    });

    // Use an <img> to load SVGs (no emoji/text fallback)
    indicatorImg = document.createElement('img');
    indicatorImg.id = 'music-indicator-img';
    indicatorImg.alt = 'Music control';
    indicatorImg.style.width = '20px';
    indicatorImg.style.height = '20px';
    indicatorImg.style.display = 'block';
    indicatorImg.style.pointerEvents = 'none';

    indicator.appendChild(indicatorImg);
    document.body.appendChild(indicator);

    // stop clicks from bubbling to the document-level handler and toggle audio
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  // Helper: check if element is inside any matched selector element
  function isInsideSelector(target, selector) {
    if (!target || !selector) return false;
    const els = document.querySelectorAll(selector);
    if (!els || els.length === 0) return false;
    for (const el of els) {
      if (el.contains(target) || el === target) return true;
    }
    return false;
  }

  function isInsideExcludedAreas(target) {
    if (!target) return false;
    if (isInsideSelector(target, excludedSelector)) return true;
    if (isInsideSelector(target, titleSelector)) return true;
    return false;
  }

  // state
  let isPlaying = false;
  let hasStartedOnce = false;
  let saveInterval = null;

  // load saved state
  function loadSavedState() {
    try {
      const savedPlaying = sessionStorage.getItem(K_IS_PLAYING);
      const savedTime = sessionStorage.getItem(K_CURRENT_TIME);
      const savedGesture = sessionStorage.getItem(K_HAS_USER_GESTURE);
      if (savedGesture === '1') hasStartedOnce = true;
      if (savedTime !== null) {
        const t = parseFloat(savedTime);
        if (!Number.isNaN(t) && isFinite(t)) {
          audio.currentTime = Math.max(0, Math.min(t, Math.max(0, audio.duration || t)));
        }
      }
      if (savedPlaying === '1') {
        attemptPlayOnLoad();
      } else {
        updateIndicator(false);
      }
    } catch (err) {
      console.warn('bgmusic: failed to load saved state', err);
    }
  }

  function saveState() {
    try {
      sessionStorage.setItem(K_IS_PLAYING, isPlaying ? '1' : '0');
      sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
      if (hasStartedOnce) sessionStorage.setItem(K_HAS_USER_GESTURE, '1');
    } catch (err) {}
  }

  async function attemptPlayOnLoad() {
    try {
      await audio.play();
      isPlaying = true;
      hasStartedOnce = true;
      updateIndicator(true);
      schedulePeriodicSave();
    } catch (err) {
      // autoplay blocked until user gesture
      updateIndicator(false);
    }
  }

  function updateIndicator(playing) {
    if (!indicator || !indicatorImg) return;
    if (playing) {
      indicatorImg.src = ICON_PAUSE_PATH;
      indicator.title = 'Music: playing (click to pause)';
      indicator.setAttribute('aria-pressed', 'true');
      indicator.setAttribute('aria-label', 'Pause background music');
    } else {
      indicatorImg.src = ICON_PLAY_PATH;
      indicator.title = 'Music: paused (click to play)';
      indicator.setAttribute('aria-pressed', 'false');
      indicator.setAttribute('aria-label', 'Play background music');
    }
  }

  async function playAudio() {
    try {
      await audio.play();
      isPlaying = true;
      hasStartedOnce = true;
      sessionStorage.setItem(K_HAS_USER_GESTURE, '1');
      updateIndicator(true);
      schedulePeriodicSave();
    } catch (err) {
      console.warn('Unable to play audio:', err);
      updateIndicator(false);
    }
    saveState();
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    updateIndicator(false);
    saveState();
    clearPeriodicSave();
  }

  function toggleAudio() {
    if (isPlaying) pauseAudio();
    else playAudio();
  }

  function schedulePeriodicSave() {
    clearPeriodicSave();
    saveInterval = setInterval(() => {
      try {
        sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
        sessionStorage.setItem(K_IS_PLAYING, isPlaying ? '1' : '0');
      } catch (err) {}
    }, 1000);
  }

  function clearPeriodicSave() {
    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }
  }

  // --- Improved user interaction handling (desktop + mobile) ---
  // We'll keep click handling for desktop, but implement a touch tap-detection
  // that treats short, low-movement touches as taps (so scrolling doesn't trigger).
  let lastTouchTime = 0;
  let ignoreNextClickUntil = 0;

  function onUserInteraction(e) {
    // Guard: ignore click events that directly follow a touch (to avoid double-trigger).
    if (e && e.type === 'click' && Date.now() < ignoreNextClickUntil) return;

    const clickTarget = e && e.target ? e.target : document.activeElement;

    // ignore form controls
    const active = document.activeElement;
    const isFormControl = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isFormControl) return;

    if (isInsideExcludedAreas(clickTarget)) return;

    // If user never started audio before, first tap should start it (user gesture)
    if (!hasStartedOnce) {
      playAudio();
      lastTouchTime = Date.now();
      return;
    }

    // For subsequent gestures, toggle
    toggleAudio();
    lastTouchTime = Date.now();
  }

  function onKeyDown(e) {
    const active = document.activeElement;
    const isFormControl = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isFormControl) return;

    // accept Space and Enter
    if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ') {
      if (isInsideExcludedAreas(active)) return;
      toggleAudio();
    }
  }

  function onBeforeUnload() {
    try {
      sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
      sessionStorage.setItem(K_IS_PLAYING, isPlaying ? '1' : '0');
      if (hasStartedOnce) sessionStorage.setItem(K_HAS_USER_GESTURE, '1');
    } catch (err) {}
  }

  // Desktop click listener (capture true to run early). We will respect ignoreNextClickUntil.
  document.addEventListener('click', onUserInteraction, true);

  // --- TOUCH TAP detection: distinguish tap vs scroll ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchMoved = false;
  let touchStartTarget = null;

  function onTouchStart(e) {
    if (!e || !e.touches || e.touches.length > 1) {
      touchMoved = true;
      return;
    }
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    touchMoved = false;
    touchStartTarget = e.target;
  }

  function onTouchMove(e) {
    if (!e || !e.touches || touchMoved) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartX);
    const dy = Math.abs(t.clientY - touchStartY);
    // if user moved more than 10px, consider it a scroll/drag
    if (dx > 10 || dy > 10) touchMoved = true;
  }

  function onTouchEnd(e) {
    const now = Date.now();
    // If we recorded movement or if touch was long, do nothing (it's likely a scroll or long-press)
    const duration = now - (touchStartTime || now);
    if (touchMoved) return;
    if (duration > 500) return; // too long to be a simple tap

    // Determine target: prefer touchStartTarget, fallback to event target
    const target = touchStartTarget || (e && e.target) || document.activeElement;

    // Ignore if inside excluded areas or if user is focused on form control
    const active = document.activeElement;
    const isFormControl = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isFormControl) return;
    if (isInsideExcludedAreas(target)) return;

    // Mark that a touch happened so the following click is ignored
    ignoreNextClickUntil = Date.now() + 700;

    // Construct a synthetic event-like object and call the main handler
    const syntheticEvent = { type: 'touchend', target: target };
    if (!hasStartedOnce) {
      // first user gesture should attempt to play
      playAudio();
    } else {
      toggleAudio();
    }
    lastTouchTime = Date.now();
  }

  // Use passive listeners for performance, but we are not calling preventDefault()
  document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });

  // Key and unload listeners
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('beforeunload', onBeforeUnload);

  audio.addEventListener('loadedmetadata', () => {
    try {
      const savedTime = sessionStorage.getItem(K_CURRENT_TIME);
      if (savedTime !== null) {
        const t = parseFloat(savedTime);
        if (!Number.isNaN(t) && isFinite(t)) {
          audio.currentTime = Math.max(0, Math.min(t, audio.duration || t));
        }
      }
    } catch (err) {}
  });

  audio.addEventListener('timeupdate', () => {
    try {
      if (isPlaying) sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
    } catch (err) {}
  });

  // On load, attempt restore state
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedState();
  });

  // Expose for debugging
  window.__bgMusic = {
    play: playAudio,
    pause: pauseAudio,
    toggle: toggleAudio,
    audioElement: audio
  };

})();
