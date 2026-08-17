(function () {
  'use strict';

  let installPrompt = null;

  function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function showMessage(message) {
    const existing = document.getElementById('pwa-message');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pwa-message';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);max-width:calc(100% - 32px);background:#12161A;color:#fff;padding:11px 15px;border-radius:11px;font:500 12.5px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 6px 20px rgba(18,22,26,.24);z-index:99999';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    showMessage('Aplicativo instalado com sucesso.');
  });

  window.pressaoPwaInstall = async function () {
    if (isInstalled()) {
      showMessage('O aplicativo já está instalado neste dispositivo.');
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      return;
    }

    showMessage('Abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.');
  };

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {
        showMessage('Não foi possível ativar o uso offline agora. Tente novamente mais tarde.');
      });
    });
  }

  if (new URLSearchParams(location.search).get('acao') === 'nova') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const button = document.querySelector('button[title="Nova medição"]');
        if (button) button.click();
      }, 1000);
    });
  }
})();

