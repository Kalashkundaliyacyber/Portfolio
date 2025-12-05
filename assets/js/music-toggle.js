// assets/js/music-toggle.js
(() => {
  // CONFIG - update if needed
  const audioSrc = 'assets/music.mp3';      // path to your audio file (relative to site root)
  const titleSelector = '#title, .site-title, header h1'; // legacy title selectors
const excludedSelector = [
  '#header',                       // header & navigation
  '.portfolio-item',               // portfolio grid item
  '.portfolio-wrap',               // portfolio wrapper
  '.portfolio-info',               // portfolio overlay
  '.portfolio-links',              // zoom / link icons
  '.portfolio-lightbox',           // lightbox trigger
  '.mobile-nav-toggle',            // mobile nav icon
  '[aria-label="Close"]',          // any aria-label close button
  '#portfolio-flters',             // filter bar container
  '#portfolio-flters li',          // individual filter tab
  '#portfolio-flters a',           // filter links
  '[data-filter]',                 // any element using data-filter
  '.row[data-aos]',                // the row wrapper for the filter bar
].join(', ');
  const volume = 0.6;                        // initial volume (0.0 - 1.0)
  const showIndicator = true;                // set false to hide the on-screen indicator

  // storage keys (sessionStorage used so it resets when browser session ends)
  const K_IS_PLAYING = 'bgmusic:isPlaying';
  const K_CURRENT_TIME = 'bgmusic:currentTime';
  const K_HAS_USER_GESTURE = 'bgmusic:hasUserGesture'; // track that user interacted previously

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

  // visual indicator (optional)
  let indicator = null;
  if (showIndicator) {
    indicator = document.createElement('div');
    indicator.id = 'music-indicator';
    indicator.innerText = '🔈';
    Object.assign(indicator.style, {
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      padding: '6px 8px',
      borderRadius: '10px',
      backdropFilter: 'blur(6px)',
      background: 'rgba(0,0,0,0.35)',
      color: 'white',
      fontSize: '18px',
      zIndex: 99999,
      cursor: 'pointer',
      userSelect: 'none'
    });
    indicator.title = 'Music: paused (click anywhere to play)';
    document.body.appendChild(indicator);

    // clicking indicator toggles music (stops propagation so header-ignore rules don't apply to it)
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  // Helper: check if an element is inside any selector's matched element(s)
  function isInsideSelector(target, selector) {
    if (!target || !selector) return false;
    const els = document.querySelectorAll(selector);
    if (!els || els.length === 0) return false;
    for (const el of els) {
      if (el.contains(target) || el === target) return true;
    }
    return false;
  }

  // Combined check: is the click inside title area OR the header (excluded) area?
  function isInsideExcludedAreas(target) {
    if (isInsideSelector(target, excludedSelector)) return true;
    if (isInsideSelector(target, titleSelector)) return true;
    return false;
  }

  // state
  let isPlaying = false;
  let hasStartedOnce = false;
  let saveInterval = null;

  // load saved state from sessionStorage
  function loadSavedState() {
    try {
      const savedPlaying = sessionStorage.getItem(K_IS_PLAYING);
      const savedTime = sessionStorage.getItem(K_CURRENT_TIME);
      const savedGesture = sessionStorage.getItem(K_HAS_USER_GESTURE);
      if (savedGesture === '1') {
        // user had interacted previously (in this browser session)
        hasStartedOnce = true;
      }
      if (savedTime !== null) {
        const t = parseFloat(savedTime);
        if (!Number.isNaN(t) && isFinite(t)) {
          // try to restore time (clamp)
          audio.currentTime = Math.max(0, Math.min(t, Math.max(0, audio.duration || t)));
        }
      }
      if (savedPlaying === '1') {
        // attempt to start playing (may fail on some browsers)
        attemptPlayOnLoad();
      } else {
        updateIndicator(false);
      }
    } catch (err) {
      console.warn('bgmusic: failed to load saved state', err);
    }
  }

  // save current state
  function saveState() {
    try {
      sessionStorage.setItem(K_IS_PLAYING, isPlaying ? '1' : '0');
      sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
      if (hasStartedOnce) sessionStorage.setItem(K_HAS_USER_GESTURE, '1');
    } catch (err) {
      // storage may be unavailable in some privacy modes
    }
  }

  // attempt to play on load (called after restoring time)
  async function attemptPlayOnLoad() {
    try {
      await audio.play();
      isPlaying = true;
      hasStartedOnce = true;
      updateIndicator(true);
      schedulePeriodicSave();
    } catch (err) {
      // Play may be blocked until a user gesture on this page.
      // We'll listen for next user gesture and then try to resume.
      console.warn('bgmusic: deferred autoplay (needs gesture):', err);
      updateIndicator(false);
    }
  }

  // update small indicator
  function updateIndicator(playing) {
    if (!indicator) return;
    if (playing) {
      indicator.innerText = '🔊';
      indicator.title = 'Music: playing (click anywhere to stop)';
    } else {
      indicator.innerText = '🔈';
      indicator.title = 'Music: paused (click anywhere to play)';
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
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  // Periodically save currentTime so navigation keeps position accurate
  function schedulePeriodicSave() {
    clearPeriodicSave();
    saveInterval = setInterval(() => {
      try {
        sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
        sessionStorage.setItem(K_IS_PLAYING, isPlaying ? '1' : '0');
      } catch (err) {
        // ignore
      }
    }, 1000); // every second
  }
  function clearPeriodicSave() {
    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }
  }

  // page-level click/touch handler
  function onUserInteraction(e) {
    const clickTarget = e.target;

    // ignore interactions inside excluded areas
    if (isInsideExcludedAreas(clickTarget)) {
      return;
    }

    // If we haven't started yet and the click was outside excluded areas -> start
    // (This user gesture sets hasStartedOnce so future pages can resume)
    if (!hasStartedOnce && !isInsideExcludedAreas(clickTarget)) {
      playAudio();
      return;
    }

    // If audio already started earlier: toggle on each click/tap anywhere (outside excluded areas)
    if (hasStartedOnce) {
      toggleAudio();
    }
  }

  // Keyboard accessibility: Space / Enter toggles (unless focus is inside input/textarea/contenteditable or excluded areas)
  function onKeyDown(e) {
    const active = document.activeElement;
    const isFormControl = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isFormControl) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      if (isInsideExcludedAreas(active)) return;
      toggleAudio();
    }
  }

  // Save state before unloading (so other pages can read it)
  function onBeforeUnload() {
    try {
      sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
      sessionStorage.setItem(K_IS_PLAYING, isPlaying ? '1' : '0');
      if (hasStartedOnce) sessionStorage.setItem(K_HAS_USER_GESTURE, '1');
    } catch (err) {}
  }

  // initialize listeners
  document.addEventListener('click', onUserInteraction, true);
  document.addEventListener('touchstart', onUserInteraction, { capture: true, passive: true });
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('beforeunload', onBeforeUnload);

  // If audio metadata loads, clamp restored time properly
  audio.addEventListener('loadedmetadata', () => {
    // If we have a saved time beyond duration, clamp to duration
    try {
      const savedTime = sessionStorage.getItem(K_CURRENT_TIME);
      if (savedTime !== null) {
        const t = parseFloat(savedTime);
        if (!Number.isNaN(t) && isFinite(t)) {
          audio.currentTime = Math.max(0, Math.min(t, audio.duration || t));
        }
      }
    } catch (err) {
      // ignore
    }
  });

  // Keep sessionStorage updated with currentTime when audio is playing (backup)
  audio.addEventListener('timeupdate', () => {
    try {
      if (isPlaying) sessionStorage.setItem(K_CURRENT_TIME, String(audio.currentTime || 0));
    } catch (err) {}
  });

  // On load, attempt to restore saved state (position + play state)
  // Wait for DOM content so excluded selectors exist
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedState();
  });

  // Expose controls for debugging if needed
  window.__bgMusic = {
    play: playAudio,
    pause: pauseAudio,
    toggle: toggleAudio,
    audioElement: audio
  };

})();