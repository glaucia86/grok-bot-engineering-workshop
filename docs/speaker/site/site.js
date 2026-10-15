'use strict';
for (const button of document.querySelectorAll('.copy-prompt, .copy-command')) {
  button.addEventListener('click', async () => {
    const text = button.parentElement.querySelector('code').textContent;
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''));
      status.textContent = button.classList.contains('copy-command') ? 'Comando copiado.' : 'Prompt copiado.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(button.parentElement.querySelector('code'));
      selection.removeAllRanges(); selection.addRange(range);
      status.textContent = 'Cópia bloqueada. O texto está selecionado; use Ctrl+C ou copie pelo menu.';
    }
  });
}
