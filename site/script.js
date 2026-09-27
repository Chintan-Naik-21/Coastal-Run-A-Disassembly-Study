(() => {
  'use strict';

  const FRAME_COUNT = 240;
  const PX_PER_FRAME = 14;                 // controls scrub speed
  const FRAME_PATH = i => `frames/${String(i).padStart(3, '0')}.webp`;

  const canvas = document.getElementById('frameCanvas');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('scrollStage');
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderCount = document.getElementById('loaderCount');
  const railFill = document.getElementById('railFill');
  const railPct = document.getElementById('railPct');
  const frameNumEl = document.getElementById('frameNum');
  const scrollCue = document.getElementById('scrollCue');
  const steps = Array.from(document.querySelectorAll('.step'));
  const replayBtn = document.getElementById('replayBtn');

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let currentFrame = -1;
  let ready = false;

  // ---------- Preload ----------
  function preload() {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = img.onerror = onOneLoaded;
      img.src = FRAME_PATH(i);
      images[i - 1] = img;
    }
  }

  function onOneLoaded() {
    loadedCount++;
    const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
    loaderFill.style.width = pct + '%';
    loaderCount.textContent = String(pct).padStart(3, '0') + '%';
    if (loadedCount >= FRAME_COUNT) finishLoading();
  }

  function finishLoading() {
    ready = true;
    setStageHeight();
    drawFrame(0);
    requestAnimationFrame(() => {
      loader.classList.add('hidden');
      onScroll();
    });
  }

  // ---------- Canvas sizing (cover-fit) ----------
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }

  function drawFrame(index) {
    if (!ready) return;
    index = Math.max(0, Math.min(FRAME_COUNT - 1, index));
    if (index === currentFrame) return;
    currentFrame = index;
    const img = images[index];
    if (!img || !img.naturalWidth) return;

    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);

    frameNumEl.textContent = String(index + 1).padStart(3, '0');
  }

  // ---------- Scroll stage height ----------
  function setStageHeight() {
    stage.style.height = (FRAME_COUNT * PX_PER_FRAME + window.innerHeight) + 'px';
  }

  // ---------- Scroll handling ----------
  let ticking = false;

  function onScroll() {
    if (!ready) return;
    const stageTop = stage.offsetTop;
    const scrollableDist = stage.offsetHeight - window.innerHeight;
    let progress = (window.scrollY - stageTop) / scrollableDist;
    progress = Math.max(0, Math.min(1, progress));

    const frameIndex = Math.round(progress * (FRAME_COUNT - 1));
    drawFrame(frameIndex);

    const pct = Math.round(progress * 100);
    railFill.style.height = pct + '%';
    railPct.textContent = String(pct).padStart(3, '0') + '%';

    steps.forEach(step => {
      const start = parseFloat(step.dataset.start);
      const end = parseFloat(step.dataset.end);
      step.classList.toggle('is-active', progress >= start && progress <= end);
    });

    scrollCue.style.opacity = progress > 0.03 ? '0' : '1';
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });

  window.addEventListener('resize', () => {
    sizeCanvas();
    setStageHeight();
    currentFrame = -1;
    onScroll();
  });

  replayBtn.addEventListener('click', () => {
    window.scrollTo({ top: stage.offsetTop + 1, behavior: 'smooth' });
  });

  // ---------- Init ----------
  sizeCanvas();
  preload();
})();
