(function () {
  'use strict';

  // Marca local de "ja instalou". Serve para o caso de a pessoa instalar e
  // depois abrir o site numa aba comum: nao existe API confiavel para isso,
  // entao usamos esta marca como pista. Ela vale por navegador — se trocar de
  // navegador ou limpar dados, o convite reaparece. Por isso ele e dispensavel.
  var CHAVE_INSTALADO = 'pressao-instalado';
  var raiz = document.documentElement;
  var promptInstalar = null;

  function ehStandalone() {
    var modos = ['standalone', 'window-controls-overlay', 'minimal-ui', 'fullscreen'];
    for (var i = 0; i < modos.length; i++) {
      if (window.matchMedia('(display-mode: ' + modos[i] + ')').matches) return true;
    }
    return window.navigator.standalone === true;
  }

  function leuMarca() {
    try { return localStorage.getItem(CHAVE_INSTALADO) === '1'; } catch (e) { return false; }
  }

  function gravarMarca() {
    try { localStorage.setItem(CHAVE_INSTALADO, '1'); } catch (e) { /* modo privado */ }
  }

  function plataforma() {
    var ua = navigator.userAgent || '';
    var iOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iOS) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  }

  // Precedencia: rodando como app > instalou agora > marca local > iOS (sempre
  // manual) > desconhecido. "desconhecido" esconde o convite, porque mostrar um
  // botao que nao instala nada e pior do que nao mostrar botao.
  function situacao() {
    if (ehStandalone()) return 'instalado';
    if (promptInstalar) return 'instalavel';
    if (leuMarca()) return 'instalado-navegador';
    if (plataforma() === 'ios') return 'manual';
    return 'indisponivel';
  }

  function aplicarSituacao() {
    raiz.setAttribute('data-pwa', situacao());
  }

  function mostrarAviso(mensagem) {
    var antigo = document.getElementById('pwa-message');
    if (antigo) antigo.remove();

    var toast = document.createElement('div');
    toast.id = 'pwa-message';
    toast.setAttribute('role', 'status');
    toast.textContent = mensagem;
    toast.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);max-width:calc(100% - 32px);background:#12161A;color:#fff;padding:11px 15px;border-radius:11px;font:500 12.5px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 6px 20px rgba(18,22,26,.24);z-index:99999';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4200);
  }

  var PASSOS = {
    ios: [
      ['Compartilhar', 'Toque no ícone de compartilhar na barra do Safari.'],
      ['Adicionar à Tela de Início', 'Role a lista e escolha essa opção.'],
      ['Adicionar', 'Confirme no canto superior direito.']
    ],
    android: [
      ['Menu do navegador', 'Toque nos três pontos no canto da tela.'],
      ['Instalar aplicativo', 'Ou "Adicionar à tela inicial", dependendo da versão.'],
      ['Instalar', 'Confirme e o ícone aparece junto dos seus apps.']
    ],
    desktop: [
      ['Barra de endereço', 'Procure o ícone de instalar, à direita do endereço.'],
      ['Instalar', 'Ou abra o menu do navegador e escolha "Instalar Pressão".']
    ]
  };

  function fecharFolha() {
    var folha = document.getElementById('pwa-folha');
    if (folha) folha.remove();
    document.removeEventListener('keydown', aoTeclar);
  }

  function aoTeclar(evento) {
    if (evento.key === 'Escape') fecharFolha();
  }

  // Instrucoes manuais, usadas quando o navegador nao oferece instalacao por
  // botao — sempre no iOS, e como saida quando o prompt nao esta disponivel.
  function abrirFolhaManual() {
    fecharFolha();
    var passos = PASSOS[plataforma()] || PASSOS.desktop;

    var fundo = document.createElement('div');
    fundo.id = 'pwa-folha';
    fundo.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(18,22,26,.42);display:flex;align-items:flex-end;justify-content:center;padding:0;font:400 14px/1.5 system-ui,sans-serif';
    fundo.addEventListener('click', function (evento) {
      if (evento.target === fundo) fecharFolha();
    });

    var folha = document.createElement('div');
    folha.setAttribute('role', 'dialog');
    folha.setAttribute('aria-modal', 'true');
    folha.setAttribute('aria-label', 'Como instalar o Pressão');
    folha.style.cssText = 'width:100%;max-width:420px;background:#fff;border-radius:22px 22px 0 0;padding:20px 20px 22px;box-shadow:0 -10px 32px rgba(18,35,32,.18)';

    var titulo = document.createElement('h2');
    titulo.textContent = 'Instalar o Pressão';
    titulo.style.cssText = 'margin:0 0 4px;font-size:17px;font-weight:660;color:#17312E;letter-spacing:-.02em';
    folha.appendChild(titulo);

    var texto = document.createElement('p');
    texto.textContent = plataforma() === 'ios'
      ? 'No iPhone a instalação é feita pelo Safari:'
      : 'Seu navegador instala pelo próprio menu:';
    texto.style.cssText = 'margin:0 0 16px;font-size:12.5px;color:#8A8F96;line-height:1.5';
    folha.appendChild(texto);

    passos.forEach(function (passo, indice) {
      var linha = document.createElement('div');
      linha.style.cssText = 'display:flex;gap:11px;align-items:flex-start;margin-bottom:12px';

      var numero = document.createElement('span');
      numero.textContent = String(indice + 1);
      numero.style.cssText = 'width:21px;height:21px;border-radius:50%;background:#0F6B62;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:0 0 21px;margin-top:1px';
      linha.appendChild(numero);

      var corpo = document.createElement('div');
      var forte = document.createElement('strong');
      forte.textContent = passo[0];
      forte.style.cssText = 'display:block;font-size:13px;font-weight:640;color:#17312E';
      var desc = document.createElement('span');
      desc.textContent = passo[1];
      desc.style.cssText = 'display:block;font-size:12px;color:#65716E;line-height:1.45;margin-top:1px';
      corpo.appendChild(forte);
      corpo.appendChild(desc);
      linha.appendChild(corpo);

      folha.appendChild(linha);
    });

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'Entendi';
    ok.style.cssText = 'width:100%;border:none;background:#0F6B62;color:#fff;border-radius:12px;padding:13px;font-size:14px;font-weight:640;cursor:pointer;margin-top:4px';
    ok.addEventListener('click', fecharFolha);
    folha.appendChild(ok);

    fundo.appendChild(folha);
    document.body.appendChild(fundo);
    ok.focus();
    document.addEventListener('keydown', aoTeclar);
  }

  window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault();
    promptInstalar = evento;
    aplicarSituacao();
  });

  window.addEventListener('appinstalled', function () {
    promptInstalar = null;
    gravarMarca();
    aplicarSituacao();
    mostrarAviso('Aplicativo instalado com sucesso.');
  });

  // Se a pessoa instalar e voltar para a aba, o display-mode muda.
  window.matchMedia('(display-mode: standalone)').addEventListener
    && window.matchMedia('(display-mode: standalone)').addEventListener('change', aplicarSituacao);

  window.pressaoPwaInstall = async function () {
    if (ehStandalone()) {
      mostrarAviso('Você já está usando o aplicativo instalado.');
      return;
    }

    if (promptInstalar) {
      promptInstalar.prompt();
      var escolha = await promptInstalar.userChoice;
      promptInstalar = null;
      if (escolha && escolha.outcome === 'accepted') gravarMarca();
      aplicarSituacao();
      return;
    }

    abrirFolhaManual();
  };

  window.pressaoPwaSituacao = situacao;

  aplicarSituacao();

  // Chrome sabe dizer se o PWA correspondente ja esta instalado. Só existe em
  // alguns navegadores, entao é reforço da marca local, nunca a única fonte.
  if (navigator.getInstalledRelatedApps) {
    navigator.getInstalledRelatedApps().then(function (apps) {
      if (apps && apps.length) { gravarMarca(); aplicarSituacao(); }
    }).catch(function () { /* sem suporte, segue com a marca local */ });
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js').catch(function () {
        mostrarAviso('Não foi possível ativar o uso offline agora. Tente novamente mais tarde.');
      });
    });
  }

  if (new URLSearchParams(location.search).get('acao') === 'nova') {
    window.addEventListener('load', function () {
      setTimeout(function () {
        var botao = document.querySelector('button[title="Nova medição"]');
        if (botao) botao.click();
      }, 1000);
    });
  }
})();
