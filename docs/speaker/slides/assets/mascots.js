/* Native SVG eyes are retained; finite cues and gaze share one RAF. */
(() => {
  'use strict';
  const bots = [];
  let instance = 0;
  document.querySelectorAll('img[src^="assets/avatars/"]').forEach(img => {
    const name = img.getAttribute('src').split('/').pop().replace('.svg', '');
    const template = document.getElementById(`mascot-${name}`);
    if (!template) return; // Keep the human avatar and any unknown assets intact.
    const svg = template.content.firstElementChild.cloneNode(true);
    // SVG styles are document-global. Isolate every mask, selector and keyframe,
    // including repeated appearances of the same character on different slides.
    const original = `mascot-${svg.dataset.mascot}-`;
    const prefix = `instance-${++instance}-${svg.dataset.mascot}-`;
    svg.querySelectorAll('*').forEach(element => {
      for (const attr of [...element.attributes]) {
        if (attr.value.includes(original)) element.setAttribute(attr.name, attr.value.replaceAll(original, prefix));
      }
      if (element.tagName.toLowerCase() === 'style') element.textContent = element.textContent.replaceAll(original, prefix);
    });
    for (const attr of img.attributes) {
      if (!['src', 'alt'].includes(attr.name)) svg.setAttribute(attr.name, attr.value);
    }
    svg.classList.add('workshop-mascot');
    if (img.alt && img.getAttribute('aria-hidden') !== 'true') {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', img.alt);
    } else svg.setAttribute('aria-hidden', 'true');
    svg.dataset.motion = 'static';
    img.replaceWith(svg);
    svg.dataset.cue = 'idle';
    let dots = null, wink = null, winkCenter = null;
    if (svg.dataset.mascotCue === 'thinking') {
      dots = document.createElementNS(svg.namespaceURI, 'g');
      dots.setAttribute('class', 'mascot-thinking');
      dots.setAttribute('aria-hidden', 'true');
      dots.setAttribute('fill', svg.querySelector('rect[fill]').getAttribute('fill'));
      [-28, 0, 28].forEach(x => {
        const dot = document.createElementNS(svg.namespaceURI, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', 110); dot.setAttribute('r', 6);
        dots.append(dot);
      });
      svg.append(dots);
    }
    if (svg.dataset.mascotCue === 'wink') {
      const eye = svg.querySelectorAll('.mascot-eye')[1];
      wink = document.createElementNS(svg.namespaceURI, 'g');
      wink.setAttribute('class', 'mascot-wink');
      // A separate wrapper preserves the supplied path and native eye matrix.
      const matrix = eye.getAttribute('transform').slice(7, -1).split(',').map(Number);
      winkCenter = [matrix[4], matrix[5]];
      eye.replaceWith(wink); wink.append(eye);
    }
    bots.push({ svg, dots, wink, winkCenter, cueStart: null, body: svg.querySelector('.mascot-motion'), face: svg.querySelector('.mascot-face'),
      x: 0, y: 0, tx: 0, ty: 0 });
  });
  if (typeof window.matchMedia !== 'function' || !bots.length) return;
  const media = window.matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)');
  const clamp = n => Math.max(-1, Math.min(1, n));
  let active = [], frame = null, lastFrame = null, currentSlide = null, printing = false;
  const allowed = () => Reveal.isReady() && media.matches && !printing && !document.hidden && !Reveal.isOverview() && !Reveal.isPaused();
  function reset() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = lastFrame = null;
    bots.forEach(bot => {
      bot.x = bot.y = bot.tx = bot.ty = 0;
      bot.body.style.removeProperty('transform');
      bot.face.style.removeProperty('transform');
      bot.svg.dataset.motion = 'static';
      clearCue(bot);
    });
  }
  function clearCue(bot) {
    bot.cueStart = null;
    bot.svg.dataset.cue = 'idle';
    if (bot.dots) bot.dots.style.removeProperty('opacity');
    if (bot.wink) bot.wink.removeAttribute('transform');
  }
  function sync() {
    reset();
    const slide = Reveal.isReady() ? Reveal.getCurrentSlide() : null;
    const entered = slide !== currentSlide;
    currentSlide = slide;
    active = bots.filter(bot => slide && slide.contains(bot.svg));
    if (!allowed()) return;
    active.forEach(bot => {
      bot.svg.dataset.motion = 'active';
      // Only entering a slide starts a cue. Resuming a tab, overview, print or
      // motion preference never replays a gesture that was already cancelled.
      if (entered && (bot.dots || bot.wink)) {
        bot.cueStart = performance.now();
        bot.svg.dataset.cue = bot.svg.dataset.mascotCue;
        if (bot.dots) bot.dots.style.opacity = 0;
      }
    });
    if (active.some(bot => bot.cueStart !== null)) schedule();
  }
  function animate(now) {
    frame = null;
    if (!allowed()) { reset(); return; }
    const delta = lastFrame === null ? 16 : Math.min(64, now - lastFrame);
    lastFrame = now;
    const ease = 1 - Math.exp(-delta / 110);
    let settled = true;
    active.forEach(bot => {
      bot.x += (bot.tx - bot.x) * ease;
      bot.y += (bot.ty - bot.y) * ease;
      if (Math.abs(bot.tx - bot.x) < .01 && Math.abs(bot.ty - bot.y) < .01) {
        bot.x = bot.tx; bot.y = bot.ty;
      } else settled = false;
      bot.body.style.transform = `translate(${bot.x * .16}px, ${bot.y * .16}px) rotate(${bot.x / 12 * 1.2}deg)`;
      bot.face.style.transform = `translate(${bot.x * .65}px, ${bot.y * .65}px)`;
      if (bot.cueStart !== null) {
        const cue = window.WorkshopMascotCues.sampleCue(bot.svg.dataset.mascotCue, Math.max(0, now - bot.cueStart));
        if (!cue) clearCue(bot);
        else {
          settled = false;
          bot.svg.dataset.cue = cue.kind;
          if (bot.dots) {
            bot.dots.style.opacity = cue.opacity;
            [...bot.dots.children].forEach((dot, i) => {
              dot.setAttribute('r', 6 + cue.pulses[i] * 5);
              dot.setAttribute('opacity', .55 + cue.pulses[i] * .45);
            });
          }
          if (bot.wink) {
            const [x, y] = bot.winkCenter;
            // SVG coordinates avoid CSS view-box transform-origin offsets.
            bot.wink.setAttribute('transform', `translate(${x} ${y}) scale(${1 + cue.close * .55} ${1 - cue.close * .88}) translate(${-x} ${-y})`);
          }
        }
      }
    });
    if (!settled) frame = requestAnimationFrame(animate);
    else lastFrame = null;
  }
  function schedule() { if (frame === null && active.length) frame = requestAnimationFrame(animate); }
  window.addEventListener('pointermove', event => {
    if (!allowed() || event.pointerType !== 'mouse') return;
    active.forEach(bot => {
      // The outer SVG never moves; Reveal's scale is accounted for by its rect.
      const rect = bot.svg.getBoundingClientRect();
      bot.tx = clamp((event.clientX - rect.left - rect.width / 2) / Math.max(160, rect.width * 1.5)) * 12;
      bot.ty = clamp((event.clientY - rect.top - rect.height / 2) / Math.max(160, rect.height * 1.5)) * 12;
    });
    schedule();
  }, { passive: true });
  function neutral() {
    active.forEach(bot => { bot.tx = bot.ty = 0; });
    if (allowed()) schedule();
  }
  window.addEventListener('mouseleave', neutral);
  window.addEventListener('blur', neutral);
  document.addEventListener('visibilitychange', sync);
  media.addEventListener('change', sync);
  // Initial hash navigation can emit slidechanged immediately before ready.
  // Do not cancel the cue that this first slidechanged has already started.
  Reveal.on('ready', () => { if (currentSlide !== Reveal.getCurrentSlide()) sync(); });
  ['slidechanged', 'overviewshown', 'overviewhidden', 'paused', 'resumed'].forEach(event => Reveal.on(event, sync));
  window.addEventListener('beforeprint', () => { printing = true; sync(); });
  window.addEventListener('afterprint', () => { printing = false; sync(); });
  window.addEventListener('pagehide', reset);
  // Covers deferred script loading after Reveal is already ready.
  if (Reveal.isReady()) sync();
})();
