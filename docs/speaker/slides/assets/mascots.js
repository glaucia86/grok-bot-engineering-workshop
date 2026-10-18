/* Progressive enhancement of local SVG fallbacks. Geometry is exported by
 * scripts/sync_speaker_mascots.py from the app's WorkshopMascot component.
 * Motion reuses BotBackdrop's bounded 12-unit gaze, 0.14 easing, 3-degree tilt,
 * 0.45 body / 0.65 face depths and BotBlink's independent 140ms blink timing.
 * No keyboard, pointer capture or network dependency is introduced.
 */
(() => {
  'use strict';
  const bots = [];
  document.querySelectorAll('img[src^="assets/avatars/"]').forEach(img => {
    const name = img.getAttribute('src').split('/').pop().replace('.svg', '');
    const template = document.getElementById(`mascot-${name}`);
    if (!template) return; // Keep the human avatar and any unknown assets intact.
    const svg = template.content.firstElementChild.cloneNode(true);
    for (const attr of img.attributes) {
      if (!['src', 'alt'].includes(attr.name)) svg.setAttribute(attr.name, attr.value);
    }
    svg.classList.add('workshop-mascot');
    if (img.alt && img.getAttribute('aria-hidden') !== 'true') {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', img.alt);
    } else svg.setAttribute('aria-hidden', 'true');
    svg.dataset.blink = 'open';
    img.replaceWith(svg);
    bots.push({ svg, body: svg.querySelector('.mascot-motion'), face: svg.querySelector('.mascot-face'),
      x: 0, y: 0, tx: 0, ty: 0, timer: null });
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
      clearTimeout(bot.timer);
      bot.timer = null;
      bot.x = bot.y = bot.tx = bot.ty = 0;
      bot.body.style.removeProperty('transform');
      bot.face.style.removeProperty('transform');
      bot.svg.dataset.blink = 'open';
    });
  }
  function blink(bot, phase) {
    bot.timer = setTimeout(() => {
      bot.timer = null;
      if (!allowed()) return;
      bot.svg.dataset.blink = 'closed';
      bot.timer = setTimeout(() => {
        bot.timer = null;
        bot.svg.dataset.blink = 'open';
        if (allowed()) blink(bot, phase);
      }, 140);
    }, 4000 + Math.random() * 4000 + phase * 600);
  }
  function sync() {
    reset();
    const slide = Reveal.isReady() ? Reveal.getCurrentSlide() : null;
    active = bots.filter(bot => slide && slide.contains(bot.svg));
    if (allowed()) active.forEach((bot, i) => blink(bot, i % 5));
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
