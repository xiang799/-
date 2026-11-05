/* Welcome artwork is separate from the Three.js models, so both remain editable. */
(() => {
  'use strict';
  const intro = document.querySelector('#welcome-intro');
  const shell = document.querySelector('#workspace-shell');
  const fill = intro.querySelector('.intro-track__fill');
  const bar = intro.querySelector('[role="progressbar"]');
  const percentage = intro.querySelector('#intro-percentage');
  const hint = intro.querySelector('#intro-hint');
  const enter = intro.querySelector('#intro-enter');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const params = new URLSearchParams(location.search);
  const preview = params.get('intro') === 'preview';
  // Layout reference mode is deliberately explicit, and never used by the real loader.
  const still = params.get('intro') === 'still';
  const minimumDuration = reduced.matches ? 650 : 4200;
  let started = performance.now();
  let target = 0, shown = 0, frame = 0, lastTick = started;
  let ready = false, failed = false, leaving = false, leaveTimer = 0, setupTimer = 0;
  const resources = [
    {src:'content.js',end:5,label:'正在打开设计档案…'},
    {src:'project-images.js',end:8},
    {src:'playlist.js',end:12,label:'正在摆好唱片…'},
    {src:'app.js',end:16},
    {src:'three.js',end:27,label:'正在准备工作台…'},
    {src:'photo.js',end:31,label:'正在放好 ID 卡…'},
    {src:'sticker-assets.js',end:68,label:'正在贴上喜欢的贴纸…'},
    {src:'models.js',end:73,label:'正在布置桌面物件…'},
    {src:'decals.js',end:75},
    {src:'layout-defaults.js',end:77},
    {src:'editor.js',end:79},
    {src:'experience.js',end:80},
    {src:'assembly.js',end:81}
  ];
  intro.classList.toggle('is-preview', preview);
  intro.classList.toggle('is-paused', still);
  function fit() {
    const mobile = innerWidth <= 600;
    const scale = mobile
      ? Math.min(innerWidth / 390, Math.max(210, innerHeight - 175) / 520)
      : Math.min(innerWidth / 1440, innerHeight / 810);
    intro.style.setProperty('--scene-scale', String(scale));
  }
  fit();
  addEventListener('resize', fit, {passive:true});
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    intro.addEventListener('pointermove', event => {
      if (reduced.matches || still) return;
      intro.style.setProperty('--pointer-x', `${(event.clientX / innerWidth - .5) * 5}px`);
      intro.style.setProperty('--pointer-y', `${(event.clientY / innerHeight - .5) * 3}px`);
    }, {passive:true});
    intro.addEventListener('pointerleave', () => {
      intro.style.setProperty('--pointer-x', '0px');
      intro.style.setProperty('--pointer-y', '0px');
    });
  }
  function update(value, label) {
    if (failed) return;
    target = Math.max(target, Math.min(100, value));
    if (label) hint.textContent = label;
  }
  function leave() {
    if (!ready || failed || leaving) return;
    leaving = true;
    clearTimeout(leaveTimer);
    clearTimeout(setupTimer);
    shell.inert = false;
    shell.removeAttribute('aria-hidden');
    document.body.classList.remove('intro-active');
    intro.classList.add('is-leaving');
    const finish = () => {
      intro.hidden = true;
      cancelAnimationFrame(frame);
      window.dispatchEvent(new CustomEvent('workspace:entered'));
      if (intro.contains(document.activeElement)) document.querySelector('[data-view="0"]')?.focus({preventScroll:true});
    };
    setTimeout(finish, reduced.matches ? 180 : 800);
  }
  function fail(error) {
    if (failed) return;
    failed = true;
    ready = false;
    clearTimeout(leaveTimer);
    clearTimeout(setupTimer);
    intro.classList.add('is-error');
    intro.querySelector('#intro-loading-label').textContent = 'TRY AGAIN';
    hint.textContent = '工作台还没准备好，请重试载入。';
    enter.textContent = '重新载入 ↗';
    enter.onclick = () => location.reload();
    const fallback = document.querySelector('#intro-fallback');
    if(fallback&&window.portfolioApp){fallback.hidden=false;fallback.onclick=()=>{failed=false;ready=true;leave();window.portfolioApp.open('works');};}
    console.error('Workspace loading failed:', error);
  }
  function complete() {
    if (failed || ready) return;
    ready = true;
    clearTimeout(setupTimer);
    update(100, '准备好了，欢迎来到我的工作台。');
    intro.classList.add('is-ready');
    window.dispatchEvent(new CustomEvent('workspace:ready'));
  }
  function tick(now) {
    const dt = Math.min(64, now - lastTick); lastTick = now;
    // Ease towards observed progress; there is no timer-generated fake percentage.
    shown += (target - shown) * (1 - Math.exp(-dt / 230));
    if (Math.abs(target - shown) < .08) shown = target;
    const display = still ? 68 : Math.floor(shown);
    percentage.textContent = `${display}%`;
    fill.style.transform = `scaleX(${display / 100})`;
    bar.setAttribute('aria-valuenow', String(display));
    if (ready && shown === 100 && !preview && !still && !failed && !leaving && !leaveTimer) {
      leaveTimer = setTimeout(leave, Math.max(0, minimumDuration - (now - started)) + 400);
    }
    if (!intro.hidden) frame = requestAnimationFrame(tick);
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => reject(new Error(`资源加载超时：${src}`)), 30000);
      script.src = src;
      script.async = false;
      script.onload = () => {clearTimeout(timeout);resolve();};
      script.onerror = () => {clearTimeout(timeout);reject(new Error(`资源加载失败：${src}`));};
      document.body.append(script);
    });
  }
  async function boot() {
    frame = requestAnimationFrame(tick);
    setupTimer = setTimeout(() => fail(new Error('工作台准备超时')), 60000);
    try {
      // Give the welcome artwork a first paint before constructing the 3D scene.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const images = [...intro.querySelectorAll('img')];
      await Promise.all(images.map(img => img.decode()));
      update(6, '正在布置工作台…');
      for (const resource of resources) {
        await loadScript(resource.src);
        update(resource.end, resource.label);
      }
    } catch (error) { fail(error); }
  }
  window.WorkspaceLoading = {update, ready:complete, fail};
  enter.onclick = leave;
  document.querySelector('#replay-intro').onclick = () => {
    if (!ready || failed) { location.reload(); return; }
    clearTimeout(leaveTimer); leaveTimer = 0;
    cancelAnimationFrame(frame);
    leaving = false; started = performance.now(); lastTick = started;
    shown = 0; target = 100;
    intro.hidden = false;
    intro.classList.remove('is-leaving');
    shell.inert = true;
    shell.setAttribute('aria-hidden', 'true');
    document.body.classList.add('intro-active');
    const entries = intro.querySelectorAll('.intro-object__entry,.welcome-letter,.welcome-dots');
    entries.forEach(node => { node.style.animation = 'none'; });
    void intro.offsetHeight;
    entries.forEach(node => { node.style.animation = ''; });
    frame = requestAnimationFrame(tick);
  };
  boot();
})();
