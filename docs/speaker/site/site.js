'use strict';
const englishGuide = document.documentElement.lang === 'en-US';
for (const link of document.querySelectorAll('.language-switch a')) {
  // Stable, explicitly shared step fragments are portable across translations.
  if (/^#step-\d{2}$/.test(location.hash)) link.hash = location.hash;
}
window.addEventListener('hashchange', () => {
  for (const link of document.querySelectorAll('.language-switch a')) {
    link.hash = /^#step-\d{2}$/.test(location.hash) ? location.hash : '';
  }
});
for (const button of document.querySelectorAll('.copy-prompt, .copy-command')) {
  button.addEventListener('click', async () => {
    const text = button.parentElement.querySelector('code').textContent;
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''));
      status.textContent = englishGuide ? (button.classList.contains('copy-command') ? 'Command copied.' : 'Text copied.') : (button.classList.contains('copy-command') ? 'Comando copiado.' : 'Prompt copiado.');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(button.parentElement.querySelector('code'));
      selection.removeAllRanges(); selection.addRange(range);
      status.textContent = englishGuide ? 'Copy blocked. Text selected; use Ctrl+C or the copy menu.' : 'Cópia bloqueada. O texto está selecionado; use Ctrl+C ou copie pelo menu.';
    }
  });
}

