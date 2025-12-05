// assets/js/music-toggle.js
(() => {
  // -------------------------
  // CONFIG - update if needed
  // -------------------------
  const audioSrc = 'assets/music.mp3';         // path to your audio file (relative to site root)
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

  function onUserInteraction(e) {
    const clickTarget = e.target;
    if (isInsideExcludedAreas(clickTarget)) return;

    if (!hasStartedOnce && !isInsideExcludedAreas(clickTarget)) {
      playAudio();
      return;
    }

    if (hasStartedOnce) toggleAudio();
  }

  function onKeyDown(e) {
    const active = document.activeElement;
    const isFormControl = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isFormControl) return;

    if (e.code === 'Space' || e.code === 'Enter') {
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

  document.addEventListener('click', onUserInteraction, true);
  document.addEventListener('touchstart', onUserInteraction, { capture: true, passive: true });
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
