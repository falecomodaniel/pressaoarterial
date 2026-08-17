import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(toolsDir);
const sourcePath = join(rootDir, 'index.original.html');
const outputPath = join(rootDir, 'index.html');

let bundle = await readFile(sourcePath, 'utf8');
const templateMatch = bundle.match(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/);
if (!templateMatch) throw new Error('Template interno não encontrado.');

let template = JSON.parse(templateMatch[1]);

function replaceOnce(label, before, after) {
  const first = template.indexOf(before);
  if (first < 0) throw new Error(`Trecho não encontrado: ${label}`);
  if (template.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Trecho duplicado inesperadamente: ${label}`);
  }
  template = template.replace(before, after);
}

function replaceEvery(label, before, after, expectedCount) {
  const count = template.split(before).length - 1;
  if (count !== expectedCount) {
    throw new Error(`${label}: esperado ${expectedCount}, encontrado ${count}`);
  }
  template = template.split(before).join(after);
}

function replaceSection(label, startMarker, endMarker, replacement) {
  const start = template.indexOf(startMarker);
  const end = template.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Seção não encontrada: ${label}`);
  }
  template = template.slice(0, start) + replacement + '\n\n  ' + template.slice(end);
}

replaceOnce(
  'metadados PWA',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  `<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pressão — acompanhamento arterial</title>
<meta name="theme-color" content="#0F6B62">
<meta name="application-name" content="Pressão">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Pressão">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">`
);

replaceOnce(
  'estado de edição',
  "    ultimoSalvo: null,\n    erro: '',",
  "    ultimoSalvo: null,\n    editandoId: null,\n    detalhesAbertos: false,\n    erro: '',"
);

replaceSection(
  'classificação atualizada DBHA 2025',
  'const CATS = {',
  'const HUMORES = [',
  `const CATS = {
  'Pressão baixa': '#4A6FA5',
  'Normal': '#2E7D57',
  'Pré-hipertensão': '#B98218',
  'HAS estágio 1': '#D2762C',
  'HAS estágio 2': '#BE4A2E',
  'HAS estágio 3': '#8E2A20'
};
const CURTA = {
  'Pressão baixa': 'Pressão baixa',
  'Normal': 'Normal',
  'Pré-hipertensão': 'Pré-hipertensão',
  'HAS estágio 1': 'Hipertensão estágio 1',
  'HAS estágio 2': 'Hipertensão estágio 2',
  'HAS estágio 3': 'Hipertensão estágio 3'
};
const FAIXA_TXT = {
  'Pressão baixa': '< 90 e < 60',
  'Normal': '< 120/80',
  'Pré-hipertensão': '120–139 ou 80–89',
  'HAS estágio 1': '140–159 ou 90–99',
  'HAS estágio 2': '160–179 ou 100–109',
  'HAS estágio 3': '≥ 180 ou ≥ 110'
};
const EXPLICA = {
  'Pressão baixa': 'Os dois valores estão abaixo de 90/60 mmHg. Se houver tontura, fraqueza ou desmaio, procure orientação profissional.',
  'Normal': 'Os valores estão abaixo de 120/80 mmHg, faixa considerada normal. Continue acompanhando com a mesma técnica de medição.',
  'Pré-hipertensão': 'Faixa de atenção entre 120–139 ou 80–89 mmHg. Uma medição isolada não confirma hipertensão; acompanhe a tendência e cuide dos hábitos.',
  'HAS estágio 1': 'Faixa elevada entre 140–159 ou 90–99 mmHg. Repita a medida após repouso e leve registros de dias diferentes para avaliação profissional.',
  'HAS estágio 2': 'Faixa bem elevada entre 160–179 ou 100–109 mmHg. Se persistir após nova medida em repouso, procure avaliação profissional em breve.',
  'HAS estágio 3': 'Faixa muito elevada: 180 ou mais na sistólica, ou 110 ou mais na diastólica. Repita após repouso; com sintomas importantes, procure atendimento de urgência.'
};
const ORDEM = ['Pressão baixa', 'Normal', 'Pré-hipertensão', 'HAS estágio 1', 'HAS estágio 2', 'HAS estágio 3'];
const NIVEL = { 'Pressão baixa': 1, 'Normal': 0, 'Pré-hipertensão': 2, 'HAS estágio 1': 3, 'HAS estágio 2': 4, 'HAS estágio 3': 5 };
const POS = { 'Pressão baixa': 5, 'Normal': 12, 'Pré-hipertensão': 34, 'HAS estágio 1': 58, 'HAS estágio 2': 80, 'HAS estágio 3': 96 };
const PIX_COPIA_COLA = '00020101021126580014br.gov.bcb.pix0136e82dca74-aff0-4dad-bffc-72a785ec89465204000053039865802BR5917DANIEL A DE PAULA6011DIVINOPOLIS62070503***6304FF7B';`
);

replaceSection(
  'regra de classificação DBHA 2025',
  'function classificar(sis, dia) {',
  'function hex2rgba',
  `function classificar(sis, dia) {
  if (!sis || !dia) return null;
  if (sis >= 180 || dia >= 110) return 'HAS estágio 3';
  if (sis >= 160 || dia >= 100) return 'HAS estágio 2';
  if (sis >= 140 || dia >= 90) return 'HAS estágio 1';
  if (sis >= 120 || dia >= 80) return 'Pré-hipertensão';
  if (sis < 90 && dia < 60) return 'Pressão baixa';
  return 'Normal';
}
`
);

replaceEvery(
  'perfil com foto',
  "perfil: { nome: '', nascimento: '', sexo: '', contato: '' }",
  "perfil: { nome: '', nascimento: '', sexo: '', contato: '', foto: '' }",
  2
);

replaceEvery(
  'padrão de perfil com foto',
  "{ nome: '', nascimento: '', sexo: '', contato: '' }",
  "{ nome: '', nascimento: '', sexo: '', contato: '', foto: '' }",
  2
);

replaceOnce(
  'histórico agrupado por dia',
  "    const historico = hist.map(decorar);",
  `    let ultimoGrupo = '';
    const historico = hist.map(function (reg) {
      const item = decorar(reg);
      const d = new Date(reg.quando);
      const chave = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      const agora = new Date();
      const hojeChave = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());
      const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
      const ontemChave = ontem.getFullYear() + '-' + pad(ontem.getMonth() + 1) + '-' + pad(ontem.getDate());
      item.mostrarGrupo = chave !== ultimoGrupo;
      item.grupo = chave === hojeChave ? 'Hoje' : (chave === ontemChave ? 'Ontem' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }));
      item.horaFmt = pad(d.getHours()) + ':' + pad(d.getMinutes());
      ultimoGrupo = chave;
      return item;
    });`
);

replaceOnce(
  'tendência resumida da tela inicial',
  "    ];\n\n    const idade = this.idade();",
  `    ];

    let tendenciaHome = 'Estável nos últimos 7 dias';
    if (seteDias.length >= 2) {
      const ordenadosSemana = seteDias.slice().sort(function (a, b) { return new Date(a.quando) - new Date(b.quando); });
      const deltaSemana = Number(ordenadosSemana[ordenadosSemana.length - 1].sis) - Number(ordenadosSemana[0].sis);
      tendenciaHome = Math.abs(deltaSemana) <= 3
        ? 'Estável nos últimos 7 dias'
        : (deltaSemana < 0 ? 'Caiu ' + Math.abs(deltaSemana) + ' mmHg nos últimos 7 dias' : 'Subiu ' + deltaSemana + ' mmHg nos últimos 7 dias');
    }
    const idade = this.idade();`
);

replaceOnce(
  'saudação e cabeçalho dinâmico',
  "    const hoje = new Date();\n\n    return {",
  `    const hoje = new Date();
    const horaAtual = hoje.getHours();
    const saudacao = horaAtual < 12 ? 'Bom dia' : (horaAtual < 18 ? 'Boa tarde' : 'Boa noite');
    const primeiroNome = (st.perfil.nome || '').trim().split(/\\s+/)[0] || '';
    const tituloInicio = primeiroNome ? saudacao + ', ' + primeiroNome : saudacao;
    const mesHistorico = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return {`
);

replaceOnce(
  'dados do cabeçalho v2',
  "      tabTitulo: rotTitulo[st.aba] || '',\n      nomeCompleto: (st.perfil.nome || '').trim() || 'Complete seu perfil em Mais',\n      iniciais: (st.perfil.nome || '—').trim().split(/\\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase() || '—',",
  `      tabTitulo: rotTitulo[st.aba] || '',
      nomeCompleto: (st.perfil.nome || '').trim() || 'Complete seu perfil em Mais',
      iniciais: (st.perfil.nome || '—').trim().split(/\\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase() || '—',
      temFotoPerfil: !!st.perfil.foto,
      semFotoPerfil: !st.perfil.foto,
      fotoPerfil: st.perfil.foto || '',
      headerTitulo: st.aba === 'inicio' ? tituloInicio : (rotTitulo[st.aba] || ''),
      headerSubtitulo: st.aba === 'inicio' ? 'Acompanhe sua saúde com tranquilidade' : ((st.perfil.nome || '').trim() || 'Seus dados ficam neste dispositivo'),`
);

replaceOnce(
  'tendência na tela inicial',
  "      semana: semana,",
  "      semana: semana,\n      tendenciaHome: tendenciaHome,"
);

replaceOnce(
  'mês do histórico',
  "      contagemFiltrada: historico.length + (historico.length === 1 ? ' medição' : ' medições'),",
  "      contagemFiltrada: historico.length + (historico.length === 1 ? ' medição' : ' medições'),\n      mesHistorico: mesHistorico.charAt(0).toUpperCase() + mesHistorico.slice(1),"
);

replaceOnce(
  'estilo visual v2',
  '</style>\n</helmet>',
  `</style>
<style>
  :root { color-scheme: light; }
  [data-app] { background: #F7F5F0 !important; }
  [data-v2-card] { background: #fff; border: 1px solid rgba(24,32,31,0.07); border-radius: 22px; box-shadow: 0 8px 28px rgba(18,35,32,0.055); }
  [data-v2-touch] { min-width: 44px; min-height: 44px; }
  [data-v2-input] { min-height: 112px; }
  @media (max-width: 380px) {
    [data-v2-input] { min-height: 98px; }
  }
</style>
</helmet>`
);

replaceSection(
  'cabeçalho v2',
  '<sc-if value="{{ mostrarHeader }}"',
  '<!-- ===================== INÍCIO',
  `<sc-if value="{{ mostrarHeader }}" hint-placeholder-val="{{ true }}">
    <header data-noprint="" style="position: sticky; top: 0; z-index: 20; background: rgba(247,245,240,0.94); backdrop-filter: blur(14px); padding: 18px 20px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
        <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 3px 12px rgba(15,107,98,0.18); background: linear-gradient(140deg, #14877B, #0A4C45); color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 700;">
          <sc-if value="{{ temFotoPerfil }}" hint-placeholder-val="{{ false }}"><img src="{{ fotoPerfil }}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; display: block;"></sc-if>
          <sc-if value="{{ semFotoPerfil }}" hint-placeholder-val="{{ true }}"><span>{{ iniciais }}</span></sc-if>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
          <span style="font-size: 18px; font-weight: 650; letter-spacing: -0.025em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ headerTitulo }}</span>
          <span style="font-size: 12px; color: #7A807D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ headerSubtitulo }}</span>
        </div>
      </div>
      <span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #7A807D; flex-shrink: 0;">{{ hojeFmt }}</span>
    </header>
  </sc-if>`
);

replaceSection(
  'início v2',
  '<!-- ===================== INÍCIO',
  '<!-- ===================== NOVA MEDIÇÃO',
  `<!-- ===================== INÍCIO ===================== -->
  <sc-if value="{{ ehInicio }}" hint-placeholder-val="{{ true }}">
    <main style="padding: 12px 20px 8px; display: flex; flex-direction: column; gap: 16px; animation: riseIn 0.4s cubic-bezier(0.2,0.7,0.3,1) both;">
      <sc-if value="{{ semRegistros }}" hint-placeholder-val="{{ false }}">
        <section style="background: linear-gradient(145deg, #0F766C 0%, #064C46 100%); border-radius: 24px; padding: 30px 24px; color: #fff; text-align: center; box-shadow: 0 14px 32px rgba(15,107,98,0.2);">
          <div style="width: 54px; height: 54px; margin: 0 auto 14px; border-radius: 18px; background: rgba(255,255,255,0.12); display: grid; place-items: center;">
            <svg sc-camel-view-box="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-5 3 10 2.5-6 1.5 3h5"></path></svg>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 21px; font-weight: 650; letter-spacing: -0.025em;">Comece a acompanhar</h2>
          <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.8);">Registre sua primeira medição para acompanhar sua evolução com tranquilidade.</p>
          <button sc-camel-on-click="{{ abrirNova }}" style="width: 100%; border: none; background: #fff; color: #0A4C45; border-radius: 15px; padding: 15px; font-size: 15px; font-weight: 650; cursor: pointer;">Nova medição</button>
        </section>
      </sc-if>

      <sc-if value="{{ temRegistros }}" hint-placeholder-val="{{ true }}">
        <section style="background: linear-gradient(145deg, #0F766C 0%, #064C46 100%); border-radius: 24px; padding: 22px; color: #fff; box-shadow: 0 14px 32px rgba(15,107,98,0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <span style="font-size: 13px; color: rgba(255,255,255,0.78);">Última medição</span>
            <span style="font-size: 11px; font-weight: 700; color: #0A4C45; background: #DDF4E8; padding: 6px 11px; border-radius: 999px;">{{ ultima.cat }}</span>
          </div>
          <div style="display: flex; align-items: baseline; justify-content: center; gap: 9px; margin: 22px 0 8px;">
            <span style="font-family: 'IBM Plex Mono', monospace; font-size: 52px; font-weight: 500; letter-spacing: -0.05em; line-height: 1;">{{ ultima.leitura }}</span>
            <span style="font-size: 13px; color: rgba(255,255,255,0.72);">mmHg</span>
          </div>
          <p style="margin: 0; text-align: center; font-size: 13px; color: rgba(255,255,255,0.76);">{{ ultima.quandoFmt }}</p>
          <div style="display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 18px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.16); font-size: 13px; color: rgba(255,255,255,0.9);">
            <svg sc-camel-view-box="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l5-5 4 3 7-7M16 7h4v4"></path></svg>
            <span>{{ tendenciaHome }}</span>
          </div>
        </section>

        <button sc-camel-on-click="{{ abrirNova }}" style="width: 100%; border: none; background: #0F766C; color: #fff; border-radius: 17px; padding: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 16px; font-weight: 650; cursor: pointer; box-shadow: 0 7px 20px rgba(15,107,98,0.18);">
          <span style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.94); color: #0F766C; display: grid; place-items: center; font-size: 23px; line-height: 1;">+</span>
          Nova medição
        </button>

        <section data-v2-card="" style="padding: 18px 16px 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 650;">Resumo da semana</h3>
            <button sc-camel-on-click="{{ irAnalise }}" style="border: none; background: none; color: #0F6B62; font-size: 12px; font-weight: 650; cursor: pointer;">Ver análise</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 8px;">
            <sc-for list="{{ semana }}" as="s" hint-placeholder-count="3">
              <div style="padding: 4px 8px; text-align: center; border-right: 1px solid #EEEAE3;">
                <span style="display: block; font-size: 10.5px; color: #7A807D; margin-bottom: 5px;">{{ s.rotulo }}</span>
                <strong style="display: block; font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 500; color: #17201F;">{{ s.valor }}</strong>
                <span style="display: block; font-size: 10px; color: #7A807D; margin-top: 3px;">{{ s.nota }}</span>
              </div>
            </sc-for>
          </div>
          <sc-if value="{{ miniTem }}" hint-placeholder-val="{{ true }}">
            <svg sc-camel-view-box="0 0 340 112" style="width: 100%; height: auto; display: block; overflow: visible; margin-top: 8px;">
              <sc-for list="{{ miniGrade }}" as="g" hint-placeholder-count="4"><line x1="30" y1="{{ g.y }}" x2="334" y2="{{ g.y }}" stroke="#EEEAE3" stroke-width="1"></line></sc-for>
              {{ miniEixoY }}
              <path d="{{ miniPathSis }}" fill="none" stroke="#0F766C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="{{ miniPathDia }}" fill="none" stroke="#69A99F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
              <sc-for list="{{ miniPontos }}" as="p" hint-placeholder-count="6"><circle cx="{{ p.x }}" cy="{{ p.y }}" r="2.7" fill="#fff" stroke="#0F766C" stroke-width="1.8"></circle></sc-for>
            </svg>
          </sc-if>
        </section>
      </sc-if>

      <section data-v2-card="" style="overflow:hidden;padding:0;background:linear-gradient(145deg,#FFFDFC,#F2F8F5);border-color:#DCE9E4;">
        <div style="display:flex;align-items:center;gap:14px;padding:17px 16px;">
          <img src="assets/illustration-apoio.png" alt="Xícara com coração" style="width:92px;height:92px;object-fit:cover;border-radius:22px;flex-shrink:0;">
          <div style="min-width:0;">
            <span style="display:inline-block;margin-bottom:7px;padding:4px 8px;border-radius:999px;background:#E4F3EE;color:#0A665D;font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;">Apoio via Pix</span>
            <h3 style="margin:0 0 6px;font-size:17px;line-height:1.2;font-weight:650;color:#17312E;letter-spacing:-.025em;">Vamos manter a pressão estável?</h3>
            <p style="margin:0;font-size:12px;line-height:1.45;color:#65716E;">Todo mundo se ajuda um pouquinho, e o app continua ajudando a gente a se cuidar.</p>
          </div>
        </div>
        <button sc-camel-on-click="{{ abrirApoio }}" style="width:100%;border:none;border-top:1px solid #DCE9E4;background:#fff;color:#0F6B62;padding:14px;font-size:14px;font-weight:650;cursor:pointer;">Quero dar uma força</button>
      </section>
    </main>
  </sc-if>`
);

replaceSection(
  'nova medição v2',
  '<!-- ===================== NOVA MEDIÇÃO',
  '<!-- ===================== SALVO',
  `<!-- ===================== NOVA MEDIÇÃO ===================== -->
  <sc-if value="{{ ehNova }}" hint-placeholder-val="{{ false }}">
    <div style="animation: fadeIn 0.25s ease both;">
      <header data-noprint="" style="position: sticky; top: 0; z-index: 20; background: linear-gradient(140deg, #0F766C, #064C46); color: #fff; padding: 18px 20px; display: flex; align-items: center; gap: 12px;">
        <button sc-camel-on-click="{{ cancelarFormulario }}" title="Voltar" aria-label="Voltar" data-v2-touch="" style="border: none; background: rgba(255,255,255,0.12); color: #fff; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; cursor: pointer;"><svg sc-camel-view-box="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"></path></svg></button>
        <span style="font-size: 18px; font-weight: 650; letter-spacing: -0.02em;">{{ tituloFormulario }}</span>
      </header>
      <main style="padding: 18px 20px 10px; display: flex; flex-direction: column; gap: 14px;">
        <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <label data-v2-card="" data-v2-input="" style="padding: 16px 12px; display: flex; flex-direction: column; gap: 7px;">
            <span style="font-size: 13px; font-weight: 650; color: #27302E;">Sistólica</span>
            <input aria-label="Pressão sistólica" type="number" inputmode="numeric" placeholder="120" value="{{ form.sis }}" sc-camel-on-change="{{ onSis }}" style="width: 100%; border: none; background: transparent; padding: 0; font-family: 'IBM Plex Mono', monospace; font-size: 44px; line-height: 1; text-align: center; color: #0A5B54;">
            <span style="font-size: 11px; text-align: center; color: #7A807D;">mmHg</span>
          </label>
          <label data-v2-card="" data-v2-input="" style="padding: 16px 12px; display: flex; flex-direction: column; gap: 7px;">
            <span style="font-size: 13px; font-weight: 650; color: #27302E;">Diastólica</span>
            <input aria-label="Pressão diastólica" type="number" inputmode="numeric" placeholder="80" value="{{ form.dia }}" sc-camel-on-change="{{ onDia }}" style="width: 100%; border: none; background: transparent; padding: 0; font-family: 'IBM Plex Mono', monospace; font-size: 44px; line-height: 1; text-align: center; color: #0A5B54;">
            <span style="font-size: 11px; text-align: center; color: #7A807D;">mmHg</span>
          </label>
        </section>

        <section style="border-radius: 20px; padding: 17px; background: #E7F3F0; border: 1px solid rgba(15,107,98,0.12);">
          <span style="font-size:12px;color:#4F6864;">Referência educativa <small style="font-weight:400;opacity:.8;">· adultos</small></span>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 3px;"><strong style="font-size: 27px; color: {{ previaCor }}; font-weight: 600;">{{ previaNome }}</strong><span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #60706D;">{{ previaNota }}</span></div>
          <div style="margin-top: 17px; position: relative; padding-top: 13px;">
            <div style="position: absolute; top: 0; left: {{ previaPos }}; width: 14px; height: 14px; border-radius: 50%; background: {{ previaCor }}; border: 3px solid #fff; transform: translate(-50%,-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.12);"></div>
            <div style="display:grid;grid-template-columns:12fr 20fr 22fr 22fr 15fr 9fr;gap:2px;"><span style="height:9px;border-radius:5px 0 0 5px;background:#4A6FA5;"></span><span style="height:9px;background:#2E7D57;"></span><span style="height:9px;background:#D6B31B;"></span><span style="height:9px;background:#E9882F;"></span><span style="height:9px;background:#D9533F;"></span><span style="height:9px;border-radius:0 5px 5px 0;background:#9E3028;"></span></div>
          </div>
          <sc-if value="{{ previaTemExplicacao }}" hint-placeholder-val="{{ false }}">
            <div style="display:flex;gap:9px;align-items:flex-start;margin-top:15px;padding-top:13px;border-top:1px solid rgba(15,107,98,.12);">
              <span style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.72);color:{{ previaCor }};display:grid;place-items:center;flex-shrink:0;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;">i</span>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#4F6864;">{{ previaExplicacao }}</p>
            </div>
          </sc-if>
        </section>

        <label data-v2-card="" style="padding: 15px 17px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <span style="font-size: 15px; font-weight: 600;">Pulso <small style="font-weight: 400; color: #7A807D;">(opcional)</small></span>
          <span style="display: flex; align-items: baseline; gap: 5px;"><input aria-label="Pulso" type="number" inputmode="numeric" placeholder="72" value="{{ form.pulso }}" sc-camel-on-change="{{ onPulso }}" style="width: 76px; border: none; background: transparent; padding: 0; font-family: 'IBM Plex Mono', monospace; font-size: 27px; text-align: right; color: #0A5B54;"><small style="color:#7A807D;">bpm</small></span>
        </label>

        <div style="display:flex;align-items:center;gap:10px;padding:4px 2px 0;">
          <span style="width:28px;height:28px;border-radius:9px;background:#E7F3F0;color:#0F766C;display:grid;place-items:center;font-size:15px;">＋</span>
          <div><strong style="display:block;font-size:14px;color:#27302E;">Detalhes da medição</strong><span style="display:block;font-size:11.5px;color:#7A807D;margin-top:2px;">Informações opcionais que ajudam a interpretar o registro</span></div>
        </div>
          <section data-v2-card="" style="padding: 17px; display: flex; flex-direction: column; gap: 14px; animation: riseIn .25s ease both;">
            <label style="display:flex;flex-direction:column;gap:6px;"><span style="font-size:11px;color:#7A807D;font-weight:650;">Data e hora</span><input type="datetime-local" value="{{ form.quando }}" sc-camel-on-change="{{ onQuando }}" style="width:100%;border:1px solid #E4E1DA;background:#FAF9F6;border-radius:12px;padding:12px;font-size:14px;"></label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div><span style="display:block;font-size:11px;color:#7A807D;font-weight:650;margin-bottom:6px;">Braço</span><div style="display:flex;gap:6px;"><button sc-camel-on-click="{{ setBracoE }}" style="flex:1;border:1px solid {{ bracoEBorda }};background:{{ bracoEBg }};color:{{ bracoECor }};border-radius:10px;padding:10px 3px;">Esquerdo</button><button sc-camel-on-click="{{ setBracoD }}" style="flex:1;border:1px solid {{ bracoDBorda }};background:{{ bracoDBg }};color:{{ bracoDCor }};border-radius:10px;padding:10px 3px;">Direito</button></div></div>
              <div><span style="display:block;font-size:11px;color:#7A807D;font-weight:650;margin-bottom:6px;">Posição</span><div style="display:flex;gap:6px;"><button sc-camel-on-click="{{ setPosS }}" style="flex:1;border:1px solid {{ posSBorda }};background:{{ posSBg }};color:{{ posSCor }};border-radius:10px;padding:10px 3px;">Sentado</button><button sc-camel-on-click="{{ setPosD }}" style="flex:1;border:1px solid {{ posDBorda }};background:{{ posDBg }};color:{{ posDCor }};border-radius:10px;padding:10px 3px;">Deitado</button></div></div>
            </div>
            <div><span style="display:block;font-size:11px;color:#7A807D;font-weight:650;margin-bottom:7px;">Como estou me sentindo</span><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;"><sc-for list="{{ humores }}" as="h" hint-placeholder-count="5"><button sc-camel-on-click="{{ h.acao }}" title="{{ h.rotulo }}" style="border:1px solid {{ h.borda }};background:{{ h.bg }};border-radius:11px;padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:4px;"><svg sc-camel-view-box="0 0 24 24" width="23" height="23" fill="none" stroke="{{ h.cor }}" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"></circle><path d="{{ h.olhos }}"></path><path d="{{ h.boca }}"></path></svg><span style="font-size:8px;color:{{ h.cor }};font-weight:650;">{{ h.rotulo }}</span></button></sc-for></div></div>
            <label style="display:flex;flex-direction:column;gap:6px;"><span style="font-size:11px;color:#7A807D;font-weight:650;">Observação</span><textarea rows="2" placeholder="Sintomas, medicação, contexto…" value="{{ form.obs }}" sc-camel-on-change="{{ onObs }}" style="width:100%;border:1px solid #E4E1DA;background:#FAF9F6;border-radius:12px;padding:11px 12px;font-size:14px;resize:vertical;"></textarea></label>
          </section>

        <button sc-camel-on-click="{{ salvar }}" style="position: sticky; bottom: 82px; z-index: 6; width: 100%; border: none; background: linear-gradient(140deg,#0F766C,#086057); color: #fff; border-radius: 17px; padding: 16px; font-size: 16px; font-weight: 650; cursor: pointer; box-shadow: 0 10px 25px rgba(15,107,98,0.25);">{{ rotuloSalvar }}</button>
        <sc-if value="{{ estaEditando }}" hint-placeholder-val="{{ false }}"><button sc-camel-on-click="{{ cancelarFormulario }}" style="border:none;background:none;color:#6A7078;padding:10px;font-size:13px;">Cancelar edição</button></sc-if>
        <sc-if value="{{ erro }}" hint-placeholder-val="{{ false }}"><p role="alert" style="margin:0;font-size:13px;color:#BE4A2E;text-align:center;">{{ erro }}</p></sc-if>
      </main>
    </div>
  </sc-if>`
);

replaceSection(
  'histórico v2',
  '<!-- ===================== HISTÓRICO',
  '<!-- ===================== ANÁLISE',
  `<!-- ===================== HISTÓRICO ===================== -->
  <sc-if value="{{ ehHistorico }}" hint-placeholder-val="{{ false }}">
    <main style="padding: 10px 20px 8px; animation: riseIn .38s ease both;">
      <div data-noprint="" style="display:flex;gap:8px;margin-bottom:12px;">
        <sc-raw-select aria-label="Período" value="{{ filtroPeriodo }}" sc-camel-on-change="{{ onFiltroPeriodo }}" style="border:1px solid rgba(15,107,98,.15);background:#E7F3F0;color:#0A5B54;border-radius:999px;padding:10px 14px;font-size:13px;font-weight:600;"><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="0">Tudo</option></sc-raw-select>
        <sc-raw-select aria-label="Classificação" value="{{ filtroCat }}" sc-camel-on-change="{{ onFiltroCat }}" style="max-width:210px;border:1px solid #E4E1DA;background:#fff;color:#27302E;border-radius:999px;padding:10px 14px;font-size:13px;"><option value="todas">Todas</option><option value="Normal">Normal</option><option value="Pré-hipertensão">Pré-hipertensão</option><option value="HAS estágio 1">HAS estágio 1</option><option value="HAS estágio 2">HAS estágio 2</option><option value="HAS estágio 3">HAS estágio 3</option><option value="Pressão baixa">Pressão baixa</option></sc-raw-select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><p style="margin:0;font-size:12px;color:#7A807D;">{{ contagemFiltrada }}</p><span style="font-size:12px;color:#7A807D;">{{ mesHistorico }}</span></div>
      <sc-if value="{{ aviso }}" hint-placeholder-val="{{ false }}"><p role="status" style="margin:0 0 12px;padding:11px 13px;border-radius:13px;background:#E7F3F0;color:#0A5B54;font-size:12.5px;text-align:center;box-shadow:0 5px 18px rgba(15,107,98,.08);">✓ {{ aviso }}</p></sc-if>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <sc-for list="{{ historico }}" as="r" hint-placeholder-count="4">
          <sc-if value="{{ r.mostrarGrupo }}" hint-placeholder-val="{{ true }}"><h3 style="margin:10px 2px 2px;font-size:14px;font-weight:650;color:#29413D;">{{ r.grupo }}</h3></sc-if>
          <article data-v2-card="" style="padding:15px 14px;animation:riseIn .28s ease both;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><strong style="font-family:'IBM Plex Mono',monospace;font-size:27px;font-weight:500;color:#0A5B54;">{{ r.leitura }}</strong><span style="font-size:10.5px;font-weight:650;color:{{ r.cor }};background:{{ r.bg }};padding:4px 8px;border-radius:999px;">{{ r.catCurta }}</span></div><div style="display:flex;gap:14px;margin-top:8px;color:#7A807D;font-size:12px;"><span>♥ {{ r.pulsoTxt }}</span><span>{{ r.horaFmt }}</span></div></div>
              <button sc-camel-on-click="{{ r.editar }}" data-noprint="" title="Editar medição" aria-label="Editar medição" data-v2-touch="" style="border:1px solid rgba(15,107,98,.14);background:#E7F3F0;color:#0F6B62;width:44px;height:44px;display:grid;place-items:center;border-radius:13px;cursor:pointer;"><svg sc-camel-view-box="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l11-11a2.8 2.8 0 00-4-4L4 16v4zM13.5 6.5l4 4"></path></svg></button>
              <button sc-camel-on-click="{{ r.excluir }}" data-noprint="" title="Excluir medição" aria-label="Excluir medição" data-v2-touch="" style="border:1px solid rgba(190,74,46,.12);background:rgba(190,74,46,.06);color:#BE4A2E;width:44px;height:44px;display:grid;place-items:center;border-radius:13px;cursor:pointer;"><svg sc-camel-view-box="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"></path></svg></button>
            </div>
            <sc-if value="{{ r.temObs }}" hint-placeholder-val="{{ false }}"><p style="margin:11px 0 0;padding-top:10px;border-top:1px solid #F0EEE8;font-size:12.5px;color:#59615F;line-height:1.45;">{{ r.obs }}</p></sc-if>
          </article>
        </sc-for>
      </div>
      <sc-if value="{{ historicoVazio }}" hint-placeholder-val="{{ false }}"><p style="text-align:center;color:#7A807D;font-size:13px;padding:46px 20px;">Nenhuma medição encontrada com esses filtros.</p></sc-if>
    </main>
  </sc-if>`
);

replaceSection(
  'relatório médico aprimorado',
  '<!-- ===================== RELATÓRIO',
  '<!-- ===================== NAV',
  `<!-- ===================== RELATÓRIO ===================== -->
  <sc-if value="{{ ehRelatorio }}" hint-placeholder-val="{{ false }}">
    <main data-report="" style="padding:20px;background:#fff;min-height:100vh;animation:fadeIn .3s ease both;color:#17201F;">
      <div data-noprint="" style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:20px;">
        <button sc-camel-on-click="{{ irAnalise }}" style="border:1px solid #E3DFD7;background:#FAF9F6;color:#27302E;border-radius:11px;padding:11px 15px;font-size:13px;cursor:pointer;">Voltar</button>
        <button sc-camel-on-click="{{ compartilharRelatorio }}" style="border:none;background:#0F766C;color:#fff;border-radius:11px;padding:11px 10px;font-size:12px;font-weight:650;cursor:pointer;">Compartilhar com meu médico</button>
        <button sc-camel-on-click="{{ imprimir }}" style="border:1px solid #0F766C;background:#fff;color:#0F6B62;border-radius:11px;padding:11px 10px;font-size:12px;font-weight:650;cursor:pointer;">Salvar em PDF</button>
      </div>
      <sc-if value="{{ aviso }}" hint-placeholder-val="{{ false }}"><p data-noprint="" role="status" style="margin:-9px 0 14px;padding:10px 12px;border-radius:11px;background:#E7F3F0;color:#0A5B54;font-size:11.5px;text-align:center;">✓ {{ aviso }}</p></sc-if>

      <header style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2px solid #0F766C;padding-bottom:14px;margin-bottom:16px;">
        <div><span style="display:block;color:#0F766C;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px;">Pressão</span><h1 style="margin:0 0 5px;font-size:20px;line-height:1.2;letter-spacing:-.025em;">Relatório de monitorização residencial</h1><p style="margin:0;font-size:11.5px;color:#6A7078;">Pressão arterial e frequência cardíaca</p></div>
        <div style="text-align:right;font-size:10.5px;color:#6A7078;line-height:1.5;"><strong style="display:block;color:#27302E;">{{ geradoEm }}</strong><span>Documento gerado pelo paciente</span></div>
      </header>

      <section style="border:1px solid #E8E5DE;border-radius:12px;padding:12px 14px;margin-bottom:14px;">
        <h2 style="margin:0 0 8px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7A807D;">Identificação</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;"><sc-for list="{{ identificacao }}" as="i" hint-placeholder-count="5"><div style="display:flex;gap:7px;font-size:11.5px;line-height:1.4;"><span style="color:#7A807D;">{{ i.rotulo }}:</span><strong style="font-weight:600;">{{ i.valor }}</strong></div></sc-for></div>
        <p style="margin:9px 0 0;padding-top:8px;border-top:1px solid #EFEDE7;font-size:11px;color:#59615F;">{{ relatorioPeriodo }}</p>
      </section>

      <section style="margin-bottom:14px;">
        <h2 style="margin:0 0 8px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7A807D;">Resumo do período</h2>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;"><sc-for list="{{ resumoRelatorio }}" as="r" hint-placeholder-count="4"><div style="border:1px solid #E8E5DE;border-radius:11px;padding:10px 8px;text-align:center;background:#FCFBF8;"><span style="display:block;font-size:9.5px;color:#7A807D;margin-bottom:5px;">{{ r.rotulo }}</span><strong style="display:block;font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:500;color:{{ r.cor }};">{{ r.valor }}</strong><span style="display:block;font-size:9px;color:#8A8F96;margin-top:3px;">{{ r.nota }}</span></div></sc-for></div>
      </section>

      <section style="display:grid;grid-template-columns:1.15fr .85fr;gap:12px;margin-bottom:15px;">
        <div style="border:1px solid #E8E5DE;border-radius:12px;padding:12px 14px;">
          <h2 style="margin:0 0 7px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7A807D;">Indicadores</h2>
          <sc-for list="{{ indicadoresRelatorio }}" as="i" hint-placeholder-count="6"><div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #F1EFEA;font-size:10.8px;"><span style="color:#68706E;">{{ i.rotulo }}</span><strong style="text-align:right;font-weight:600;color:{{ i.cor }};">{{ i.valor }}</strong></div></sc-for>
        </div>
        <div style="border:1px solid #E8E5DE;border-radius:12px;padding:12px 14px;">
          <h2 style="margin:0 0 8px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7A807D;">Distribuição</h2>
          <sc-for list="{{ distribuicaoRelatorio }}" as="d" hint-placeholder-count="4"><div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;font-size:10px;"><span style="color:{{ d.cor }};font-weight:600;">{{ d.rotulo }}</span><span style="color:#7A807D;">{{ d.valor }}</span></div><div style="height:5px;border-radius:999px;background:#EEECE7;overflow:hidden;"><span style="display:block;width:{{ d.largura }};height:100%;background:{{ d.cor }};border-radius:999px;"></span></div></div></sc-for>
          <sc-if value="{{ distribuicaoVazia }}" hint-placeholder-val="{{ false }}"><p style="font-size:10.5px;color:#8A8F96;">Sem registros no período.</p></sc-if>
        </div>
      </section>

      <div style="border-left:3px solid {{ relatorioNotaCor }};background:{{ relatorioNotaBg }};border-radius:0 10px 10px 0;padding:10px 12px;margin-bottom:15px;"><strong style="display:block;font-size:11px;color:{{ relatorioNotaCor }};margin-bottom:3px;">Leitura automática dos registros</strong><p style="margin:0;font-size:10.5px;line-height:1.5;color:#4F5B59;">{{ relatorioNota }}</p></div>

      <h2 style="margin:0 0 7px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7A807D;">Registros detalhados</h2>
      <sc-raw-table style="width:100%;border-collapse:collapse;font-size:9.7px;">
        <sc-raw-thead><sc-raw-tr style="border-bottom:1.5px solid #0F766C;background:#F7F5F0;"><sc-raw-th style="text-align:left;padding:6px 4px;">Data / hora</sc-raw-th><sc-raw-th style="text-align:right;padding:6px 4px;">PA</sc-raw-th><sc-raw-th style="text-align:right;padding:6px 4px;">FC</sc-raw-th><sc-raw-th style="text-align:left;padding:6px 5px;">Classificação</sc-raw-th><sc-raw-th style="text-align:left;padding:6px 5px;">Contexto</sc-raw-th><sc-raw-th style="text-align:left;padding:6px 4px;">Observação</sc-raw-th></sc-raw-tr></sc-raw-thead>
        <sc-raw-tbody><sc-for list="{{ tabelaRelatorio }}" as="t" hint-placeholder-count="6"><sc-raw-tr style="border-bottom:1px solid #EFEDE7;"><sc-raw-td style="padding:6px 4px;color:#59615F;white-space:nowrap;">{{ t.quandoFmt }}</sc-raw-td><sc-raw-td style="padding:6px 4px;text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;white-space:nowrap;">{{ t.leitura }}</sc-raw-td><sc-raw-td style="padding:6px 4px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#59615F;">{{ t.pulsoNum }}</sc-raw-td><sc-raw-td style="padding:6px 5px;color:{{ t.cor }};font-weight:600;">{{ t.catCurta }}</sc-raw-td><sc-raw-td style="padding:6px 5px;color:#59615F;">{{ t.contexto }}</sc-raw-td><sc-raw-td style="padding:6px 4px;color:#59615F;max-width:130px;">{{ t.obsRelatorio }}</sc-raw-td></sc-raw-tr></sc-for></sc-raw-tbody>
      </sc-raw-table>

      <footer style="margin-top:16px;border-top:1px solid #D9D6CF;padding-top:10px;font-size:9.5px;color:#7A807D;line-height:1.5;"><strong style="color:#59615F;">Importante:</strong> registros domiciliares informados pelo próprio paciente. Classificação educativa baseada nas faixas de consultório para adultos da Diretriz Brasileira de Hipertensão Arterial 2025. Uma medição isolada não confirma diagnóstico nem substitui avaliação profissional. A interpretação deve considerar técnica de medida, sintomas, medicamentos e contexto clínico.</footer>
    </main>
  </sc-if>`
);

replaceOnce(
  'cálculos adicionais do relatório',
  "    const naMeta = doPeriodo.filter(function (r) { return Number(r.sis) < Number(st.metas.sis) && Number(r.dia) < Number(st.metas.dia); }).length;",
  `    const naMeta = doPeriodo.filter(function (r) { return Number(r.sis) < Number(st.metas.sis) && Number(r.dia) < Number(st.metas.dia); }).length;
    const diaList = doPeriodo.map(function (r) { return Number(r.dia); });
    const estagio2Mais = doPeriodo.filter(function (r) { return NIVEL[classificar(Number(r.sis), Number(r.dia))] >= 4; }).length;
    const distribuicaoRelatorio = ORDEM.map(function (c) {
      const qtd = doPeriodo.filter(function (r) { return classificar(Number(r.sis), Number(r.dia)) === c; }).length;
      return { rotulo: CURTA[c], cor: CATS[c], valor: qtd + (qtd === 1 ? ' leitura' : ' leituras'), largura: n ? Math.max(4, Math.round((qtd / n) * 100)) + '%' : '0%', qtd: qtd };
    }).filter(function (d) { return d.qtd > 0; });
    let relatorioNota = 'Não há medições no período selecionado.';
    let relatorioNotaCor = '#6A7078', relatorioNotaBg = '#F5F3EF';
    if (n) {
      relatorioNota = 'A média do período foi ' + mSis + '/' + mDia + ' mmHg, classificada como ' + (CURTA[mCat] || mCat) + '. ' + picos + (picos === 1 ? ' leitura ficou' : ' leituras ficaram') + ' em hipertensão estágio 1 ou acima; ' + estagio2Mais + (estagio2Mais === 1 ? ' ficou' : ' ficaram') + ' em estágio 2 ou acima.';
      relatorioNotaCor = CATS[mCat] || '#0F766C';
      relatorioNotaBg = hex2rgba(relatorioNotaCor, 0.07);
      if (n < 5) relatorioNota += ' A quantidade de registros ainda é pequena; observe a tendência com cautela.';
    }`
);

replaceOnce(
  'dados adicionais do relatório',
  "      identificacao: [",
  `      resumoRelatorio: [
        { rotulo: 'Média da PA', valor: mSis ? mSis + '/' + mDia : '—', nota: 'mmHg', cor: mCat ? CATS[mCat] : '#6A7078' },
        { rotulo: 'Medições', valor: String(n), nota: st.periodo ? 'em ' + st.periodo + ' dias' : 'histórico', cor: '#17201F' },
        { rotulo: 'Pulso médio', valor: mPulso ? String(mPulso) : '—', nota: 'bpm', cor: '#6B5CA5' },
        { rotulo: 'Dentro da meta', valor: n ? Math.round((naMeta / n) * 100) + '%' : '—', nota: '< ' + st.metas.sis + '/' + st.metas.dia, cor: '#0F766C' }
      ],
      indicadoresRelatorio: [
        { rotulo: 'Classificação da média', valor: mCat ? CURTA[mCat] : '—', cor: mCat ? CATS[mCat] : '#6A7078' },
        { rotulo: 'Faixa sistólica', valor: sisList.length ? Math.min.apply(null, sisList) + '–' + Math.max.apply(null, sisList) + ' mmHg' : '—', cor: '#17201F' },
        { rotulo: 'Faixa diastólica', valor: diaList.length ? Math.min.apply(null, diaList) + '–' + Math.max.apply(null, diaList) + ' mmHg' : '—', cor: '#17201F' },
        { rotulo: 'Estágio 1 ou acima', valor: picos + ' de ' + n, cor: picos ? '#BE4A2E' : '#2E7D57' },
        { rotulo: 'Estágio 2 ou acima', valor: estagio2Mais + ' de ' + n, cor: estagio2Mais ? '#BE4A2E' : '#2E7D57' },
        { rotulo: 'Meta informada', valor: '< ' + st.metas.sis + '/' + st.metas.dia + ' mmHg', cor: '#0F766C' }
      ],
      distribuicaoRelatorio: distribuicaoRelatorio,
      distribuicaoVazia: distribuicaoRelatorio.length === 0,
      relatorioNota: relatorioNota, relatorioNotaCor: relatorioNotaCor, relatorioNotaBg: relatorioNotaBg,
      identificacao: [`
);

replaceOnce(
  'observações detalhadas do relatório',
  "      tabelaRelatorio: doPeriodo.slice().reverse().map(decorar),",
  `      tabelaRelatorio: doPeriodo.slice().reverse().map(function (r) {
        const item = decorar(r);
        const humor = (HUMOR_MAP[r.humor] || {}).rotulo;
        item.obsRelatorio = [humor ? 'Sensação: ' + humor : '', r.obs || ''].filter(Boolean).join(' · ') || '—';
        return item;
      }),`
);

replaceOnce(
  'impressão do relatório aprimorado',
  "    [data-app] { max-width: none !important; box-shadow: none !important; padding-bottom: 0 !important; }",
  `    [data-app] { max-width: none !important; box-shadow: none !important; padding-bottom: 0 !important; }
    [data-report] { padding: 0 !important; font-size: 10pt !important; }
    [data-report] table { page-break-inside: auto; }
    [data-report] tr { page-break-inside: avoid; page-break-after: auto; }
    @page { size: A4; margin: 12mm; }`
);

replaceOnce(
  'ação editar decorada',
  "      humorBoca: h ? h.boca : '',\n      excluir: function () { self.excluirRegistro(r.id); }",
  "      humorBoca: h ? h.boca : '',\n      editar: function () { self.editarRegistro(r.id); },\n      excluir: function () { self.excluirRegistro(r.id); }"
);

replaceOnce(
  'ações do formulário',
  "      abrirNova: function () { self.setState({ aba: 'nova', erro: '', form: Object.assign({}, self.state.form, { quando: localInput(new Date()) }) }); },\n      voltarInicio: function () { self.setState({ aba: 'inicio' }); },",
  `      abrirNova: function () {
        const proximaAba = self.state.pularPreparo ? 'nova' : 'preparo';
        self.setState({
          aba: proximaAba, editandoId: null, detalhesAbertos: false, erro: '', aviso: '',
          form: { sis: '', dia: '', pulso: '', braco: self.state.form.braco || 'Esquerdo', posicao: self.state.form.posicao || 'Sentado', humor: '', obs: '', quando: localInput(new Date()) }
        });
      },
      continuarNova: function () { self.setState({ aba: 'nova', erro: '', aviso: '' }); },
      naoMostrarPreparo: function () {
        self.atualizar({ pularPreparo: true, aba: 'nova', erro: '', aviso: '' });
      },
      abrirApoio: function () { self.setState({ aba: 'apoio', pixCopiado: false, aviso: '', erro: '' }); },
      rotuloPix: st.pixCopiado ? 'Código Pix copiado! ✓' : 'Copiar código Pix',
      copiarPix: function () {
        const concluir = function () {
          self.setState({ pixCopiado: true });
          setTimeout(function () { self.setState({ pixCopiado: false }); }, 2400);
        };
        const copiarAlternativo = function () {
          const campo = document.createElement('textarea');
          campo.value = PIX_COPIA_COLA;
          campo.setAttribute('readonly', '');
          campo.style.position = 'fixed'; campo.style.opacity = '0';
          document.body.appendChild(campo); campo.select();
          try { document.execCommand('copy'); concluir(); } catch (err) { /* mantém o botão disponível */ }
          document.body.removeChild(campo);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PIX_COPIA_COLA).then(concluir, copiarAlternativo);
        else copiarAlternativo();
      },
      cancelarFormulario: function () { self.cancelarFormulario(); },
      voltarInicio: function () { self.setState({ aba: 'inicio' }); },`
);

replaceOnce(
  'rótulos de edição',
  "      // formulário\n      form: st.form, erro: st.erro,",
  `      // formulário
      form: st.form, erro: st.erro,
      estaEditando: !!st.editandoId,
      tituloFormulario: st.editandoId ? 'Editar medição' : 'Nova medição',
      rotuloSalvar: st.editandoId ? 'Salvar alterações' : 'Salvar medição',
      detalhesAbertos: !!st.detalhesAbertos,
      detalhesRotacao: st.detalhesAbertos ? 'rotate(180deg)' : 'none',
      toggleDetalhes: function () { self.setState({ detalhesAbertos: !self.state.detalhesAbertos }); },`
);

replaceOnce(
  'ação instalar',
  "      apagarTudo: function () { self.apagarTudo(); },",
  "      apagarTudo: function () { self.apagarTudo(); },\n      instalarApp: function () { if (window.pressaoPwaInstall) window.pressaoPwaInstall(); },"
);

replaceOnce(
  'foto no cadastro',
  '        <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 600;">Meus dados</h3>',
  `        <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 600;">Meus dados</h3>
        <div style="display:flex;align-items:center;gap:14px;margin:0 0 18px;padding:14px;border-radius:16px;background:#F7F5F0;border:1px solid #EEEAE3;">
          <div style="width:68px;height:68px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(140deg,#14877B,#0A4C45);color:#fff;display:grid;place-items:center;font-size:18px;font-weight:700;box-shadow:0 5px 16px rgba(15,107,98,.18);">
            <sc-if value="{{ temFotoPerfil }}" hint-placeholder-val="{{ false }}"><img src="{{ fotoPerfil }}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;display:block;"></sc-if>
            <sc-if value="{{ semFotoPerfil }}" hint-placeholder-val="{{ true }}"><span>{{ iniciais }}</span></sc-if>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;">
            <strong style="font-size:13px;color:#27302E;">Foto de perfil <span style="font-weight:400;color:#7A807D;">(opcional)</span></strong>
            <label style="display:inline-flex;align-items:center;justify-content:center;border:none;background:#0F766C;color:#fff;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:650;cursor:pointer;">Escolher foto<input type="file" accept="image/*" sc-camel-on-change="{{ onFoto }}" style="display:none;"></label>
            <sc-if value="{{ temFotoPerfil }}" hint-placeholder-val="{{ false }}"><button sc-camel-on-click="{{ removerFoto }}" style="border:none;background:none;color:#BE4A2E;padding:0;font-size:11.5px;cursor:pointer;">Remover foto</button></sc-if>
          </div>
        </div>`
);

replaceOnce(
  'ações da foto de perfil',
  "      onContato: function (e) { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { contato: e.target.value }) }); },",
  `      onContato: function (e) { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { contato: e.target.value }) }); },
      onFoto: function (e) { self.atualizarFoto(e); },
      removerFoto: function () { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { foto: '' }), aviso: 'Foto removida.' }); },`
);

replaceOnce(
  'processamento local da foto',
  '  idade() {',
  `  atualizarFoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/^image\\//.test(file.type)) {
      e.target.value = '';
      return this.setState({ aviso: 'Escolha um arquivo de imagem.' });
    }
    if (file.size > 8 * 1024 * 1024) {
      e.target.value = '';
      return this.setState({ aviso: 'A foto deve ter no máximo 8 MB.' });
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = () => {
        const lado = Math.min(imagem.width, imagem.height);
        const origemX = Math.max(0, (imagem.width - lado) / 2);
        const origemY = Math.max(0, (imagem.height - lado) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 320;
        const contexto = canvas.getContext('2d');
        contexto.drawImage(imagem, origemX, origemY, lado, lado, 0, 0, 320, 320);
        const foto = canvas.toDataURL('image/jpeg', 0.82);
        this.atualizar({ perfil: Object.assign({}, this.state.perfil, { foto: foto }), aviso: 'Foto atualizada.' });
      };
      imagem.onerror = () => this.setState({ aviso: 'Não foi possível abrir esta imagem.' });
      imagem.src = leitor.result;
    };
    leitor.onerror = () => this.setState({ aviso: 'Não foi possível ler esta imagem.' });
    leitor.readAsDataURL(file);
    e.target.value = '';
  }

  idade() {`
);

replaceOnce(
  'instalação e contato',
  '      <p style="font-size: 11px; color: #A0A4A9; line-height: 1.6; text-align: center; padding: 0 10px 6px;">Os dados ficam apenas neste navegador. Este app não substitui avaliação médica.</p>',
  `      <section data-noprint="" style="background: linear-gradient(145deg, rgba(15,107,98,0.09), rgba(15,107,98,0.03)); border: 1px solid rgba(15,107,98,0.2); border-radius: 16px; padding: 16px; text-align: center;">
        <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #0A4C45;">Use como aplicativo</h3>
        <p style="margin: 6px 0 12px; font-size: 12px; color: #6A7078; line-height: 1.5;">Instale para abrir em uma janela própria e continuar usando mesmo sem internet.</p>
        <button sc-camel-on-click="{{ instalarApp }}" style="width: 100%; border: none; background: #0F6B62; color: #fff; border-radius: 11px; padding: 12px; font-size: 13.5px; font-weight: 600; cursor: pointer;">Instalar aplicativo</button>
      </section>

      <a href="mailto:falecomodaniek@gmail.com" aria-label="Enviar e-mail para o desenvolvedor" style="display: flex; align-items: center; justify-content: center; gap: 7px; color: #8A8F96; font-size: 11px; padding: 4px 8px;">
        <svg sc-camel-view-box="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3zM3 6l9 7 9-7"></path></svg>
        <span>Dúvidas ou sugestões? falecomodaniek@gmail.com</span>
      </a>
      <p style="font-size: 11px; color: #A0A4A9; line-height: 1.6; text-align: center; padding: 0 10px 6px;">Os dados ficam apenas neste dispositivo. Este app não substitui avaliação médica.</p>`
);

const oldSave = `  salvar() {
    const f = this.state.form;
    const sis = Number(f.sis), dia = Number(f.dia);
    if (!sis || !dia) return this.setState({ erro: 'Informe sistólica e diastólica.' });
    if (sis < 50 || sis > 300 || dia < 30 || dia > 200) return this.setState({ erro: 'Valores fora da faixa esperada.' });
    if (dia >= sis) return this.setState({ erro: 'A diastólica deve ser menor que a sistólica.' });
    const reg = {
      id: 'r' + Date.now(),
      quando: new Date(f.quando || Date.now()).toISOString(),
      sis: sis, dia: dia, pulso: f.pulso ? Number(f.pulso) : null,
      braco: f.braco, posicao: f.posicao, humor: f.humor || '', obs: f.obs.trim()
    };
    const registros = [reg].concat(this.state.registros).sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); });
    this.setState({
      registros: registros, erro: '', ultimoSalvo: reg, aba: 'salvo',
      form: { sis: '', dia: '', pulso: '', braco: f.braco, posicao: f.posicao, humor: '', obs: '', quando: localInput(new Date()) }
    }, () => this.persistir());
  }

  excluirRegistro(id) {
    const registros = this.state.registros.filter(function (r) { return r.id !== id; });
    this.atualizar({ registros: registros });
  }`;

const newSave = `  salvar() {
    const f = this.state.form;
    const sis = Number(f.sis), dia = Number(f.dia);
    if (!sis || !dia) return this.setState({ erro: 'Informe sistólica e diastólica.' });
    if (sis < 50 || sis > 300 || dia < 30 || dia > 200) return this.setState({ erro: 'Valores fora da faixa esperada.' });
    if (dia >= sis) return this.setState({ erro: 'A diastólica deve ser menor que a sistólica.' });
    const editandoId = this.state.editandoId;
    const reg = {
      id: editandoId || ('r' + Date.now()),
      quando: new Date(f.quando || Date.now()).toISOString(),
      sis: sis, dia: dia, pulso: f.pulso ? Number(f.pulso) : null,
      braco: f.braco, posicao: f.posicao, humor: f.humor || '', obs: f.obs.trim()
    };
    const registros = (editandoId
      ? this.state.registros.map(function (r) { return r.id === editandoId ? reg : r; })
      : [reg].concat(this.state.registros)
    ).sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); });
    this.setState({
      registros: registros,
      editandoId: null,
      detalhesAbertos: false,
      erro: '',
      aviso: editandoId ? 'Medição atualizada com sucesso.' : '',
      ultimoSalvo: reg,
      aba: editandoId ? 'historico' : 'salvo',
      form: { sis: '', dia: '', pulso: '', braco: f.braco, posicao: f.posicao, humor: '', obs: '', quando: localInput(new Date()) }
    }, () => this.persistir());
  }

  editarRegistro(id) {
    const reg = this.state.registros.find(function (r) { return r.id === id; });
    if (!reg) return;
    this.setState({
      aba: 'nova', editandoId: id, detalhesAbertos: true, erro: '', aviso: '',
      form: {
        sis: String(reg.sis || ''), dia: String(reg.dia || ''), pulso: reg.pulso ? String(reg.pulso) : '',
        braco: reg.braco || 'Esquerdo', posicao: reg.posicao || 'Sentado', humor: reg.humor || '',
        obs: reg.obs || '', quando: localInput(new Date(reg.quando))
      }
    });
  }

  cancelarFormulario() {
    const estavaEditando = !!this.state.editandoId;
    this.setState({
      aba: estavaEditando ? 'historico' : 'inicio', editandoId: null, detalhesAbertos: false, erro: '',
      form: { sis: '', dia: '', pulso: '', braco: this.state.form.braco || 'Esquerdo', posicao: this.state.form.posicao || 'Sentado', humor: '', obs: '', quando: localInput(new Date()) }
    });
  }

  excluirRegistro(id) {
    if (!window.confirm('Excluir esta medição? Esta ação não pode ser desfeita.')) return;
    const registros = this.state.registros.filter(function (r) { return r.id !== id; });
    this.atualizar({ registros: registros, aviso: 'Medição excluída.' });
  }`;

replaceOnce('lógica de edição e exclusão', oldSave, newSave);

replaceOnce(
  'carregamento PWA',
  '\n\n</body></html>',
  '\n<script src="pwa.js"></script>\n\n</body></html>'
);

replaceOnce(
  'estado sem lembretes e com preparo',
  "    metas: { sis: 130, dia: 80 },\n    lembretes: [],\n    registros: [],\n    novoLembrete: '08:00',",
  "    metas: { sis: 130, dia: 80 },\n    registros: [],\n    pularPreparo: false,"
);

replaceOnce(
  'carregamento sem lembretes',
  "          metas: Object.assign({ sis: 130, dia: 80 }, d.metas || {}),\n          lembretes: d.lembretes || [],\n          registros: (d.registros || []).slice().sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); })",
  "          metas: Object.assign({ sis: 130, dia: 80 }, d.metas || {}),\n          registros: (d.registros || []).slice().sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); }),\n          pularPreparo: !!d.pularPreparo"
);

replaceOnce(
  'persistência sem lembretes',
  "    const dados = { versao: 1, perfil: s.perfil, metas: s.metas, lembretes: s.lembretes, registros: s.registros };",
  "    const dados = { versao: 2, perfil: s.perfil, metas: s.metas, registros: s.registros, pularPreparo: !!s.pularPreparo };"
);

replaceOnce(
  'restauração sem lembretes',
  "          metas: Object.assign({ sis: 130, dia: 80 }, d.metas || {}),\n          lembretes: d.lembretes || [],\n          registros: d.registros.slice().sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); }),",
  "          metas: Object.assign({ sis: 130, dia: 80 }, d.metas || {}),\n          registros: d.registros.slice().sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); }),"
);

replaceOnce(
  'limpeza sem lembretes',
  "      metas: { sis: 130, dia: 80 }, lembretes: [], registros: [], ultimoSalvo: null, aviso: 'Dados apagados.'",
  "      metas: { sis: 130, dia: 80 }, registros: [], ultimoSalvo: null, aviso: 'Dados apagados.'"
);

replaceSection(
  'dados da tela mais sem lembretes',
  '      // perfil / metas / lembretes / glossário',
  '      // backup',
  `      // perfil, metas e glossário
      perfil: st.perfil, metas: st.metas,
      idadeTexto: idade != null ? idade + ' anos' : '—',
      onNome: function (e) { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { nome: e.target.value }) }); },
      onNascimento: function (e) { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { nascimento: e.target.value }) }); },
      onSexo: function (e) { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { sexo: e.target.value }) }); },
      onContato: function (e) { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { contato: e.target.value }) }); },
      onFoto: function (e) { self.atualizarFoto(e); },
      removerFoto: function () { self.atualizar({ perfil: Object.assign({}, self.state.perfil, { foto: '' }), aviso: 'Foto removida.' }); },
      onMetaSis: function (e) { self.atualizar({ metas: Object.assign({}, self.state.metas, { sis: e.target.value }) }); },
      onMetaDia: function (e) { self.atualizar({ metas: Object.assign({}, self.state.metas, { dia: e.target.value }) }); },
      dentroMeta: n ? naMeta + ' de ' + n : '—',
      glossario: ORDEM.map(function (c) {
        return { nome: CURTA[c], cor: CATS[c], faixa: FAIXA_TXT[c], texto: EXPLICA[c] };
      }),`
);

replaceOnce(
  'abas de preparo',
  "      ehInicio: st.aba === 'inicio', ehNova: st.aba === 'nova', ehSalvo: st.aba === 'salvo',",
  "      ehInicio: st.aba === 'inicio', ehApoio: st.aba === 'apoio', ehPreparo: st.aba === 'preparo', ehNova: st.aba === 'nova', ehSalvo: st.aba === 'salvo',"
);

replaceOnce(
  'visibilidade da navegação',
  "      mostrarHeader: ['inicio', 'historico', 'analise', 'mais'].indexOf(st.aba) >= 0,",
  "      mostrarHeader: ['inicio', 'historico', 'analise', 'mais'].indexOf(st.aba) >= 0,\n      mostrarNav: ['inicio', 'historico', 'analise', 'mais'].indexOf(st.aba) >= 0,"
);

replaceOnce(
  'navegação condicional abertura',
  '  <nav data-noprint=""',
  '  <sc-if value="{{ mostrarNav }}" hint-placeholder-val="{{ true }}">\n  <nav data-noprint=""'
);

replaceOnce(
  'navegação condicional fechamento',
  '  </nav>\n</div>\n\n</x-dc>',
  '  </nav>\n  </sc-if>\n</div>\n\n</x-dc>'
);

replaceOnce(
  'tela de preparo antes da medição',
  '<!-- ===================== NOVA MEDIÇÃO ===================== -->',
  `<!-- ===================== APOIO ===================== -->
  <sc-if value="{{ ehApoio }}" hint-placeholder-val="{{ false }}">
    <div style="min-height:100vh;background:#FFF9F4;animation:fadeIn .25s ease both;">
      <header style="background:linear-gradient(140deg,#0F766C,#064C46);color:#fff;padding:18px 20px;display:flex;align-items:center;gap:12px;">
        <button sc-camel-on-click="{{ voltarInicio }}" title="Voltar" aria-label="Voltar" data-v2-touch="" style="border:none;background:rgba(255,255,255,.12);color:#fff;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;cursor:pointer;"><svg sc-camel-view-box="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"></path></svg></button>
        <span style="font-size:18px;font-weight:650;letter-spacing:-.02em;">Apoie com Pix</span>
      </header>
      <main style="padding:18px 20px 30px;display:flex;flex-direction:column;gap:14px;">
        <img src="assets/illustration-apoio.png" alt="Xícara com coração e uma plantinha" style="width:165px;height:165px;object-fit:cover;border-radius:38px;align-self:center;box-shadow:0 14px 34px rgba(15,107,98,.09);">
        <div style="text-align:center;padding:0 5px;">
          <h1 style="margin:0 0 9px;font-size:24px;line-height:1.18;color:#17312E;letter-spacing:-.035em;">Uma mãozinha faz toda a diferença</h1>
          <p style="margin:0;font-size:14px;line-height:1.58;color:#5E6B68;">Se o Pressão já te ajudou alguma vez, você pode dar uma força para o projeto continuar.</p>
        </div>
        <section data-v2-card="" style="padding:19px 18px;text-align:center;background:#fff;border-color:#DCE9E4;">
          <span style="display:inline-flex;align-items:center;gap:7px;background:#E7F3F0;color:#0A665D;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:700;">Pix disponível</span>
          <p style="margin:12px 0 14px;font-size:13px;line-height:1.5;color:#65716E;">Escaneie pelo aplicativo do seu banco</p>
          <div style="width:220px;height:220px;margin:0 auto;padding:10px;border:1px solid #DCE9E4;border-radius:20px;background:#fff;box-shadow:0 7px 22px rgba(15,107,98,.08);">
            <img src="assets/pix-qrcode.png" alt="QR Code Pix para apoiar o Pressão" style="display:block;width:100%;height:100%;object-fit:contain;">
          </div>
          <p style="margin:13px 0 0;font-size:12px;color:#65716E;">Recebedor: <strong style="color:#31413E;">Daniel A. de Paula</strong></p>
          <div style="display:flex;align-items:center;gap:9px;margin:15px 0 0;color:#82908D;"><span style="height:1px;background:#E4EAE7;flex:1;"></span><span style="font-size:11px;">ou use o Pix copia e cola</span><span style="height:1px;background:#E4EAE7;flex:1;"></span></div>
          <button sc-camel-on-click="{{ copiarPix }}" style="width:100%;margin-top:13px;border:none;background:#0F766C;color:#fff;border-radius:15px;padding:15px;font-size:14px;font-weight:650;cursor:pointer;box-shadow:0 8px 20px rgba(15,107,98,.18);">{{ rotuloPix }}</button>
        </section>
        <p style="margin:2px 12px 0;text-align:center;font-size:15px;line-height:1.55;color:#35504B;">Não precisa ser muito. O que vier já faz diferença. 💚</p>
      </main>
    </div>
  </sc-if>

  <!-- ===================== PREPARO ===================== -->
  <sc-if value="{{ ehPreparo }}" hint-placeholder-val="{{ false }}">
    <div style="min-height:100vh;background:#F7F5F0;animation:fadeIn .25s ease both;">
      <header style="background:linear-gradient(140deg,#0F766C,#064C46);color:#fff;padding:18px 20px;display:flex;align-items:center;gap:12px;">
        <button sc-camel-on-click="{{ voltarInicio }}" title="Voltar" aria-label="Voltar" data-v2-touch="" style="border:none;background:rgba(255,255,255,.12);color:#fff;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;cursor:pointer;"><svg sc-camel-view-box="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"></path></svg></button>
        <span style="font-size:18px;font-weight:650;letter-spacing:-.02em;">Antes de medir</span>
      </header>
      <main style="padding:24px 20px 28px;display:flex;flex-direction:column;gap:14px;">
        <img src="assets/illustration-preparo.png" alt="Pessoa medindo a pressão com o braço apoiado" style="width:100%;height:230px;object-fit:cover;object-position:center 43%;border-radius:26px;box-shadow:0 12px 30px rgba(15,107,98,.09);">
        <div style="text-align:center;margin-bottom:2px;"><h1 style="margin:0 0 7px;font-size:23px;line-height:1.2;color:#17312E;letter-spacing:-.03em;">Vamos preparar tudo?</h1><p style="margin:0;font-size:13px;line-height:1.5;color:#6A7774;">Três cuidados rápidos para deixar a medição mais consistente.</p></div>
        <section data-v2-card="" style="padding:4px 16px;">
          <div style="display:flex;align-items:center;gap:13px;padding:15px 0;border-bottom:1px solid #EEEAE3;"><span style="width:42px;height:42px;border-radius:14px;background:#E7F3F0;color:#0F766C;display:grid;place-items:center;font-size:21px;flex-shrink:0;">◷</span><strong style="font-size:15px;font-weight:600;color:#27302E;">Descanse um pouquinho</strong></div>
          <div style="display:flex;align-items:center;gap:13px;padding:15px 0;border-bottom:1px solid #EEEAE3;"><span style="width:42px;height:42px;border-radius:14px;background:#E7F3F0;color:#0F766C;display:grid;place-items:center;font-size:21px;flex-shrink:0;">╯</span><strong style="font-size:15px;font-weight:600;color:#27302E;">Apoie o braço</strong></div>
          <div style="display:flex;align-items:center;gap:13px;padding:15px 0;"><span style="width:42px;height:42px;border-radius:14px;background:#E7F3F0;color:#0F766C;display:grid;place-items:center;font-size:20px;flex-shrink:0;">⌑</span><strong style="font-size:15px;font-weight:600;color:#27302E;">Evite conversar durante a medição</strong></div>
        </section>
        <button sc-camel-on-click="{{ continuarNova }}" style="width:100%;border:none;background:linear-gradient(140deg,#0F766C,#086057);color:#fff;border-radius:17px;padding:16px;font-size:16px;font-weight:650;cursor:pointer;box-shadow:0 10px 25px rgba(15,107,98,.22);">Estou pronto</button>
        <button sc-camel-on-click="{{ naoMostrarPreparo }}" style="border:none;background:none;color:#0F6B62;padding:10px;font-size:13px;text-decoration:underline;cursor:pointer;">Não mostrar novamente</button>
      </main>
    </div>
  </sc-if>

  <!-- ===================== NOVA MEDIÇÃO ===================== -->`
);

replaceSection(
  'confirmação humana da medição',
  '<!-- ===================== SALVO',
  '<!-- ===================== HISTÓRICO',
  `<!-- ===================== SALVO ===================== -->
  <sc-if value="{{ ehSalvo }}" hint-placeholder-val="{{ false }}">
    <div style="min-height:100vh;background:#F7F5F0;animation:fadeIn .25s ease both;">
      <header style="background:linear-gradient(140deg,#0F766C,#064C46);color:#fff;padding:20px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:18px;font-weight:650;">Medição salva</span>
      </header>
      <main style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div role="status" style="align-self:center;display:flex;align-items:center;gap:8px;background:#E7F3F0;color:#0A5B54;border:1px solid rgba(15,107,98,.15);border-radius:13px;padding:10px 14px;font-size:13px;font-weight:600;box-shadow:0 5px 18px rgba(15,107,98,.1);">✓ Medição salva!</div>
        <div style="width:100px;height:100px;margin:0 auto;border-radius:34px;background:linear-gradient(145deg,#DDF3ED,#F4FBF8);display:grid;place-items:center;color:#0F766C;">
          <svg sc-camel-view-box="0 0 64 64" width="68" height="68" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 26a12 12 0 0121-8 12 12 0 0121 8c0 13-21 27-21 27S12 39 12 26z"></path><path d="M10 33h13l4-9 8 19 5-12h14"></path></svg>
        </div>
        <h1 style="margin:0;text-align:center;font-size:24px;line-height:1.2;letter-spacing:-.035em;color:#17312E;">Tudo certo por aqui 💚</h1>
        <section data-v2-card="" style="padding:22px 20px;text-align:center;">
          <div style="display:flex;align-items:baseline;justify-content:center;gap:8px;"><strong style="font-family:'IBM Plex Mono',monospace;font-size:47px;font-weight:500;letter-spacing:-.045em;color:#0A5B54;">{{ salvo.leitura }}</strong><span style="font-size:13px;color:#7A807D;">mmHg</span></div>
          <span style="display:inline-block;margin-top:10px;font-size:12px;font-weight:700;color:{{ salvo.cor }};background:{{ salvo.bg }};padding:6px 13px;border-radius:999px;">{{ salvo.catCurta }}</span>
          <p style="margin:11px 0 0;font-size:12.5px;color:#7A807D;">{{ salvo.quandoFmt }}</p>
        </section>
        <section style="background:{{ salvo.bg }};border:1px solid {{ salvo.borda }};border-radius:16px;padding:15px 16px;"><p style="margin:0;font-size:12.5px;line-height:1.5;color:#3F4A48;">{{ salvo.explicacao }}</p></section>
        <button sc-camel-on-click="{{ voltarInicio }}" style="width:100%;border:none;background:#0F766C;color:#fff;border-radius:15px;padding:15px;font-size:15px;font-weight:650;cursor:pointer;">Voltar ao início</button>
        <button sc-camel-on-click="{{ irHistorico }}" style="width:100%;border:1px solid #0F766C;background:#fff;color:#0F6B62;border-radius:15px;padding:14px;font-size:14px;font-weight:650;cursor:pointer;">Ver no histórico</button>
      </main>
    </div>
  </sc-if>`
);

replaceSection(
  'remoção da interface de lembretes',
  `      <section style="background: #fff; border: 1px solid #E3DFD7; border-radius: 18px; padding: 18px;">
        <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 600;">Lembretes</h3>`,
  `      <section style="background: #fff; border: 1px solid #E3DFD7; border-radius: 18px; padding: 18px;">
        <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 600;">O que significa cada classificação</h3>`,
  ''
);

replaceOnce(
  'título simples do backup',
  '<h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 600;">Backup e envio</h3>',
  '<h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 600;">Backup dos seus dados</h3>'
);

replaceOnce(
  'explicação simples do backup',
  'O arquivo JSON contém perfil, metas e todas as medições. Salve e anexe no WhatsApp, e-mail ou Telegram.',
  'Guarde uma cópia para não perder seu histórico ao trocar de aparelho ou reinstalar o app.'
);

replaceOnce('botão salvar backup', '>Baixar JSON</button>', '>Salvar backup</button>');
replaceOnce('botão salvar planilha', '>Baixar CSV</button>', '>Salvar planilha</button>');
replaceOnce('botão restaurar backup', '            Importar JSON', '            Restaurar backup');
replaceOnce(
  'acessibilidade do restaurar backup',
  '<label style="border: 1px solid #E3DFD7; background: #FAF9F6; color: #12161A; border-radius: 11px; padding: 13px 10px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center;" style-hover="border-color: #0F6B62;">\n            Restaurar backup',
  '<label role="button" tabindex="0" style="border: 1px solid #E3DFD7; background: #FAF9F6; color: #12161A; border-radius: 11px; padding: 13px 10px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center;" style-hover="border-color: #0F6B62;">\n            Restaurar backup'
);

replaceOnce(
  'cartão de privacidade',
  `      <section data-noprint="" style="background: linear-gradient(145deg, rgba(15,107,98,0.09), rgba(15,107,98,0.03)); border: 1px solid rgba(15,107,98,0.2); border-radius: 16px; padding: 16px; text-align: center;">`,
  `      <section style="background:#E7F3F0;border:1px solid rgba(15,107,98,.14);border-radius:16px;padding:16px;display:flex;gap:12px;align-items:flex-start;">
        <span style="width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.7);color:#0F766C;display:grid;place-items:center;flex-shrink:0;"><svg sc-camel-view-box="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3zM8.5 12l2.2 2.2 4.8-5"></path></svg></span>
        <div><h3 style="margin:1px 0 5px;font-size:14px;font-weight:650;color:#0A4C45;">Seus dados são seus</h3><p style="margin:0;font-size:12px;line-height:1.5;color:#536562;">Tudo fica neste dispositivo. Nada é enviado sem você escolher.</p></div>
      </section>

      <section data-noprint="" style="background: linear-gradient(145deg, rgba(15,107,98,0.09), rgba(15,107,98,0.03)); border: 1px solid rgba(15,107,98,0.2); border-radius: 16px; padding: 16px; text-align: center;">`
);

replaceOnce(
  'texto simples da instalação',
  'Instale para abrir em uma janela própria e continuar usando mesmo sem internet.',
  'Instale para abrir o Pressão como qualquer outro aplicativo.'
);

replaceOnce(
  'confirmação antes de restaurar backup',
  "        if (!d || !Array.isArray(d.registros)) throw new Error('formato');\n        this.atualizar({",
  "        if (!d || !Array.isArray(d.registros)) throw new Error('formato');\n        if (!window.confirm('Restaurar este backup? Os dados atuais serão substituídos pelos dados salvos no backup.')) return;\n        this.atualizar({"
);

replaceOnce(
  'mensagem de backup restaurado',
  "          aviso: d.registros.length + ' medições importadas.'",
  "          aviso: 'Backup restaurado com sucesso. ' + d.registros.length + (d.registros.length === 1 ? ' medição recuperada.' : ' medições recuperadas.')"
);

replaceOnce(
  'erro simples de restauração',
  "        this.setState({ aviso: 'Não foi possível ler este arquivo JSON.' });",
  "        this.setState({ aviso: 'Não foi possível restaurar este backup.' });"
);

replaceOnce(
  'mensagem simples de backup salvo',
  "    this.setState({ aviso: 'Arquivo JSON gerado. Anexe no WhatsApp, e-mail ou Telegram.' });",
  "    this.setState({ aviso: 'Backup salvo no seu dispositivo.' });"
);

replaceOnce(
  'nome amigável do backup',
  "    return 'pressao-' + p + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.' + ext;",
  "    return (ext === 'json' ? 'backup-pressao-' : 'pressao-') + p + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.' + ext;"
);

replaceOnce(
  'compartilhamento do relatório',
  '  importarJson(e) {',
  `  compartilharRelatorio() {
    const lista = this.noPeriodo(this.state.periodo);
    const mSis = this.media(lista, 'sis'), mDia = this.media(lista, 'dia'), mPulso = this.media(lista, 'pulso');
    const texto = [
      'Resumo de pressão arterial',
      'Nome: ' + (this.state.perfil.nome || '—'),
      'Período: ' + (this.state.periodo ? 'últimos ' + this.state.periodo + ' dias' : 'histórico completo'),
      'Medições: ' + lista.length,
      'Média: ' + (mSis ? mSis + '/' + mDia + ' mmHg' : '—'),
      'Pulso médio: ' + (mPulso ? mPulso + ' bpm' : '—'),
      '',
      'Últimas medições:'
    ].concat(lista.slice(0, 10).map(function (r) {
      return '• ' + fmtDataHora(r.quando) + ' — ' + r.sis + '/' + r.dia + (r.pulso ? ' · ' + r.pulso + ' bpm' : '');
    })).join('\\n');
    const copiar = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
          () => this.setState({ aviso: 'Resumo copiado. Agora é só enviar ao seu médico.' }),
          () => this.setState({ aviso: 'Não foi possível compartilhar agora.' })
        );
      } else this.setState({ aviso: 'Não foi possível compartilhar agora.' });
    };
    if (navigator.share) {
      navigator.share({ title: 'Resumo de pressão arterial', text: texto }).then(
        () => this.setState({ aviso: 'Resumo compartilhado.' }),
        (err) => { if (!err || err.name !== 'AbortError') copiar(); }
      );
    } else copiar();
  }

  importarJson(e) {`
);

replaceOnce(
  'ação de compartilhar relatório',
  "      imprimir: function () { window.print(); }",
  "      compartilharRelatorio: function () { self.compartilharRelatorio(); },\n      imprimir: function () { window.print(); }"
);

const encodedTemplate = JSON.stringify(template)
  .replace(/<\//g, '<\\u002F')
  .replace(/<!--/g, '<\\u0021--');
bundle = bundle.replace(templateMatch[1], encodedTemplate);
bundle = bundle.replace('<title>Bundled Page</title>', '<title>Pressão — acompanhamento arterial</title>');
bundle = bundle.replace(
  '<meta charset="utf-8">',
  `<meta charset="utf-8">
  <meta name="theme-color" content="#0F6B62">
  <meta name="description" content="Acompanhe sua pressão arterial com tranquilidade, direto no seu dispositivo.">
  <meta property="og:title" content="Pressão — acompanhamento arterial">
  <meta property="og:description" content="Acompanhe sua saúde com tranquilidade.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://pressao-app-daniek.falecomodaniel.chatgpt.site/">
  <meta property="og:image" content="https://pressao-app-daniek.falecomodaniel.chatgpt.site/social-preview.png">
  <meta property="og:image:width" content="1731">
  <meta property="og:image:height" content="909">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" type="image/png" href="icons/icon-192.png">`
);

await writeFile(outputPath, bundle, 'utf8');
console.log(`PWA gerada em ${outputPath}`);
