/* User-supplied SVG animation is retained; wrappers add bounded mouse gaze. */
(() => {
  'use strict';
  const bots = [];
  let instance = 0;
  document.querySelectorAll('img[src^="assets/avatars/"],img[src^="../assets/avatars/"]').forEach(img => {
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
    bots.push({ svg, body: svg.querySelector('.mascot-motion'), face: svg.querySelector('.mascot-face'),
      x: 0, y: 0, tx: 0, ty: 0 });
  });
  if (typeof window.matchMedia !== 'function' || !bots.length) return;
  const media = window.matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)');
  const clamp = n => Math.max(-1, Math.min(1, n));
  let active = [], frame = null;
  const allowed = () => Reveal.isReady() && media.matches && !document.hidden && !Reveal.isOverview() && !Reveal.isPaused();
  function reset() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    bots.forEach(bot => {
      bot.x = bot.y = bot.tx = bot.ty = 0;
      bot.body.style.removeProperty('transform');
      bot.face.style.removeProperty('transform');
      bot.svg.dataset.motion = 'static';
    });
  }
  function sync() {
    reset();
    const slide = Reveal.isReady() ? Reveal.getCurrentSlide() : null;
    active = bots.filter(bot => slide && slide.contains(bot.svg));
    if (allowed()) active.forEach(bot => { bot.svg.dataset.motion = 'active'; });
  }
  function animate() {
    frame = null;
    if (!allowed()) { reset(); return; }
    let settled = true;
    active.forEach(bot => {
      bot.x += (bot.tx - bot.x) * .14;
      bot.y += (bot.ty - bot.y) * .14;
      if (Math.abs(bot.tx - bot.x) < .01 && Math.abs(bot.ty - bot.y) < .01) {
        bot.x = bot.tx; bot.y = bot.ty;
      } else settled = false;
      bot.body.style.transform = `translate(${bot.x * .45}px, ${bot.y * .45}px) rotate(${bot.x / 12 * 3}deg)`;
      bot.face.style.transform = `translate(${bot.x * .65}px, ${bot.y * .65}px)`;
    });
    if (!settled) frame = requestAnimationFrame(animate);
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
  ['ready', 'slidechanged', 'overviewshown', 'overviewhidden', 'paused', 'resumed'].forEach(event => Reveal.on(event, sync));
  window.addEventListener('pagehide', reset);
})();
