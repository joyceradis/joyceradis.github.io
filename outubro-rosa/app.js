/* Ação Outubro Rosa · fluxo da ficha (interface).
   Regras de dados em ficha.js, PDF em pdf.js. Nada aqui bloqueia o avanço. */
import { digits, maskCpf, maskCep, maskDate, maskPhone, firstName, readData, panorama, missing, textSummary } from './ficha.js';
import { createPdf } from './pdf.js';

/* Edite aqui: contato, página pública e Pix. */
const CONFIG = {
  whatsapp: '5527998134032',
  siteUrl: 'https://joyceradis.github.io/outubro-rosa/',
  pixPayload: '00020126580014br.gov.bcb.pix0136e5d18663-c4e4-4d42-9696-8827dbafb3245204000053039865802BR5925JOYCE_RADIS_DE_SOUZA_DE_O6005Serra610929161-78662290525MCDY32430233178986346970463043652',
  pixEmail: 'contato@drajoyceradis.com'
};
const STEP_NAMES = ['Seus dados', 'Exames', 'Sua saúde', 'Dados do pedido', 'Atendimento'];

const $ = id => document.getElementById(id);
const form = $('form');
const wizard = $('wizard');
const steps = [...document.querySelectorAll('.step')];
const TOTAL = steps.length;
const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
let current = 1;
let confirmedGaps = false;
let ficha = null;

/* ---------- Campos com máscara ---------- */
const masks = { cpf: maskCpf, cep: maskCep, nascimento: maskDate, telefone: maskPhone };
Object.entries(masks).forEach(([id, fn]) => $(id).addEventListener('input', e => {
  e.target.value = fn(e.target.value);
  if (id === 'cep') onCepInput(e.target.value);
}));
$('uf').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2); });

/* ---------- CEP: busca automática, endereço sempre editável ---------- */
const addr = $('addr');
const cepStatus = $('cepStatus');
let cepAbort = null;
const showAddress = () => { addr.hidden = false; };

function onCepInput(masked) {
  const cep = digits(masked);
  if (cep.length === 8) lookupCep(cep);
  else cepStatus.textContent = 'Ao digitar o CEP, preenchemos o endereço.';
}
async function lookupCep(cep) {
  cepAbort?.abort();
  cepAbort = new AbortController();
  cepStatus.textContent = 'Procurando o endereço…';
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: cepAbort.signal, mode: 'cors', credentials: 'omit', cache: 'no-store' });
    const data = r.ok ? await r.json() : null;
    if (!data || data.erro) throw new Error('não encontrado');
    if (digits($('cep').value) !== cep) return;
    $('logradouro').value = data.logradouro || '';
    $('bairro').value = data.bairro || '';
    $('cidade').value = data.localidade || '';
    $('uf').value = data.uf || '';
    showAddress();
    cepStatus.textContent = 'Endereço encontrado. Confira e informe o número.';
    $('numero').focus();
  } catch (err) {
    if (err.name === 'AbortError') return;
    showAddress();
    cepStatus.textContent = 'Não encontramos esse CEP. Digite o endereço.';
  }
}
$('cepManual').addEventListener('click', () => { showAddress(); $('logradouro').focus(); });

/* ---------- Mostrar/ocultar blocos condicionais: data-when="campo:valor" ---------- */
function syncConditionals() {
  document.querySelectorAll('[data-when]').forEach(el => {
    const [name, value] = el.dataset.when.split(':');
    el.hidden = form.elements[name]?.value !== value;
  });
}

/* ---------- Panorama por idade ---------- */
function renderPanorama() {
  const box = $('panorama');
  const d = readData(form);
  const p = panorama(d);
  if (!p) { box.hidden = true; return; }
  const el = (tag, cls, txt) => Object.assign(document.createElement(tag), { className: cls, textContent: txt });
  box.replaceChildren(el('p', 'pano-k', 'Seu panorama'));
  p.rows.forEach(r => {
    const row = el('div', 'pano-row', '');
    row.append(el('b', '', r.name), el('span', `pill ${r.tone}`, r.label), el('p', '', r.text));
    box.append(row);
  });
  box.append(el('p', 'pano-foot', p.foot));
  box.hidden = false;
}

/* ---------- Convênios indisponíveis ---------- */
document.querySelectorAll('.plan-off').forEach(btn => btn.addEventListener('click', () => {
  $('planNote').textContent = `${btn.dataset.plan} não está disponível neste atendimento. Siga com a opção Particular, já selecionada.`;
  btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap');
}));

/* ---------- Navegação ---------- */
const softNote = $('softNote');
function setNextLabel() { $('nextLbl').textContent = current === TOTAL ? (confirmedGaps ? 'Gerar assim mesmo' : 'Concluir ficha') : 'Continuar'; }

function goTo(n, scroll = true) {
  current = Math.max(1, Math.min(TOTAL, n));
  confirmedGaps = false; softNote.hidden = true;
  steps.forEach((s, i) => { s.hidden = i + 1 !== current; });
  wizard.dataset.step = current;
  $('pCur').textContent = current; $('pTot').textContent = TOTAL; $('pName').textContent = STEP_NAMES[current - 1];
  $('back').hidden = current === 1;
  setNextLabel();
  if (current === 2) renderPanorama();
  if (scroll) {
    scrollTo({ top: Math.max(0, wizard.getBoundingClientRect().top + scrollY - 84), behavior: smooth });
    steps[current - 1].querySelector('h2')?.focus({ preventScroll: true });
  }
}

$('next').addEventListener('click', () => {
  if (current < TOTAL) return goTo(current + 1);
  const gaps = missing(readData(form));
  if (gaps.length && !confirmedGaps) {
    confirmedGaps = true;
    softNote.textContent = `Ficou em branco: ${gaps.join(', ')}. Você pode gerar assim mesmo, mas a Dra. Joyce pode pedir depois.`;
    softNote.hidden = false; setNextLabel();
    softNote.scrollIntoView({ behavior: smooth, block: 'center' });
    return;
  }
  finish();
});
$('back').addEventListener('click', () => goTo(current - 1));
form.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('input:not([type=radio]):not([type=checkbox])')) { e.preventDefault(); $('next').click(); }
});
form.addEventListener('submit', e => e.preventDefault());
form.addEventListener('change', () => {
  syncConditionals();
  if (current === 2) renderPanorama();
  if (confirmedGaps) { confirmedGaps = false; softNote.hidden = true; setNextLabel(); }
});

/* ---------- Resultado: PDF, compartilhar, baixar ---------- */
function finish() {
  const d = readData(form);
  try {
    if (!window.jspdf?.jsPDF) throw new Error('jsPDF indisponível');
    ficha = { d, file: createPdf(d) };
  } catch (err) {
    softNote.textContent = 'Não foi possível gerar o PDF. Atualize a página e tente de novo.';
    softNote.hidden = false;
    return;
  }
  wizard.hidden = true;
  $('rName').textContent = firstName(d.nome) || 'você';
  $('rAttn').hidden = d.sintomas !== 'Sim';
  $('waText').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(textSummary(d))}`;
  $('result').hidden = false;
  $('result').focus({ preventScroll: true });
  scrollTo({ top: Math.max(0, $('result').getBoundingClientRect().top + scrollY - 84), behavior: smooth });
}

function saveFile(file) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
$('download').addEventListener('click', () => ficha && saveFile(ficha.file));
$('share').addEventListener('click', async () => {
  if (!ficha) return;
  try {
    if (navigator.canShare?.({ files: [ficha.file] })) {
      await navigator.share({ files: [ficha.file], title: 'Ficha Outubro Rosa | Dra. Joyce Radis', text: 'Ficha confidencial para avaliação médica individual.' });
    } else {
      saveFile(ficha.file);
      $('shareHint').textContent = 'PDF baixado. Anexe o arquivo na conversa com a Dra. Joyce no WhatsApp, ou envie como mensagem de texto.';
    }
  } catch (err) {
    if (err?.name !== 'AbortError') $('shareHint').textContent = 'Não foi possível abrir o compartilhamento. Use Baixar PDF ou envie como mensagem de texto.';
  }
});
$('editAgain').addEventListener('click', () => { $('result').hidden = true; wizard.hidden = false; goTo(TOTAL); });
$('shareFriend').addEventListener('click', async () => {
  const data = { title: 'Ação Outubro Rosa', text: 'Fiz minha ficha da Ação Outubro Rosa com a Dra. Joyce Radis. Leva 3 minutos:', url: CONFIG.siteUrl };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); $('shareFriend').textContent = 'Link copiado. É só colar na conversa.'; }
  } catch { /* compartilhamento cancelado */ }
});

/* ---------- Diálogos e Pix ---------- */
const openDialog = dlg => dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
document.querySelectorAll('[data-open-pix]').forEach(b => b.addEventListener('click', () => openDialog($('pixDialog'))));
['openPrivacy', 'openPrivacy2'].forEach(id => $(id).addEventListener('click', () => openDialog($('privacyDialog'))));
document.querySelectorAll('dialog').forEach(dlg => dlg.addEventListener('click', e => {
  if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close();
}));

/* Botões [data-copy="pixEmail|pixPayload"], na tela final e no diálogo */
async function copyPix(btn) {
  const span = btn.querySelector('span');
  btn.dataset.label ??= span.textContent;
  const text = CONFIG[btn.dataset.copy];
  try { await navigator.clipboard.writeText(text); }
  catch {
    const t = Object.assign(document.createElement('textarea'), { value: text });
    t.setAttribute('readonly', ''); document.body.append(t); t.select();
    const ok = document.execCommand('copy'); t.remove();
    if (!ok) { span.textContent = 'Use o QR Code'; setTimeout(() => { span.textContent = btn.dataset.label; }, 2400); return; }
  }
  span.textContent = 'Copiado, obrigada!';
  $('copyFb').textContent = 'Copiado para a área de transferência.';
  btn.classList.add('done');
  setTimeout(() => { span.textContent = btn.dataset.label; btn.classList.remove('done'); $('copyFb').textContent = ''; }, 2400);
}
document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', () => copyPix(btn)));

goTo(1, false);
