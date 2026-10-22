(() => {
  'use strict';

  /* ---------- Configuração (edite aqui) ---------- */
  const CONFIG = {
    whatsapp: '5527998134032',
    siteUrl: 'https://joyceradis.github.io/outubro-rosa/',
    pixPayload: '00020126580014br.gov.bcb.pix0136e5d18663-c4e4-4d42-9696-8827dbafb3245204000053039865802BR5925JOYCE_RADIS_DE_SOUZA_DE_O6005Serra610929161-78662290525MCDY32430233178986346970463043652',
    pixEmail: 'contato@drajoyceradis.com'
  };

  const $ = id => document.getElementById(id);
  const form = $('form');
  const wizard = $('wizard');
  const steps = Array.from(document.querySelectorAll('.step'));
  const TOTAL = steps.length;
  const CHEER = ['Vamos começar', 'Você está indo bem', 'Metade do caminho', 'Falta pouco', 'Quase lá', 'Última etapa'];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 1;
  let cepAbort = null;

  const digits = v => String(v || '').replace(/\D/g, '');
  const val = id => $(id).value.trim();
  const picked = name => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
  const one = name => picked(name)[0] || '';
  const firstName = full => (full.trim().split(/\s+/)[0] || '').replace(/^./, c => c.toLocaleUpperCase('pt-BR'));

  /* ---------- Erros ---------- */
  function setError(key, text) {
    const wrap = form.querySelector(`[data-f="${key}"]`);
    if (!wrap) return false;
    wrap.classList.add('err');
    const msg = wrap.querySelector(':scope > .msg');
    if (msg) msg.textContent = text;
    const target = wrap.querySelector('input:not([type=radio]):not([type=checkbox]),textarea') || wrap.querySelector('input');
    if (!setError.first) setError.first = { wrap, target };
    return false;
  }
  function clearErrors() {
    setError.first = null;
    form.querySelectorAll('.field.err').forEach(f => { f.classList.remove('err'); const m = f.querySelector(':scope > .msg'); if (m) m.textContent = ''; });
  }
  function clearFieldError(el) {
    const wrap = el.closest('[data-f]');
    if (!wrap) return;
    wrap.classList.remove('err');
    const m = wrap.querySelector(':scope > .msg'); if (m) m.textContent = '';
  }
  form.addEventListener('input', e => clearFieldError(e.target));
  form.addEventListener('change', e => clearFieldError(e.target));

  /* ---------- Máscaras ---------- */
  const maskCpf = v => digits(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  const maskDate = v => { const n = digits(v).slice(0, 8); return n.length > 4 ? `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}` : n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n; };
  const maskCep = v => { const n = digits(v).slice(0, 8); return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n; };
  function maskPhone(v) {
    const n = digits(v).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (n.length <= 2) return n ? `(${n}` : '';
    const cut = n.length > 10 ? 7 : 6;
    return n.length <= 6 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : `(${n.slice(0, 2)}) ${n.slice(2, cut)}-${n.slice(cut)}`;
  }
  function validCpf(v) {
    const c = digits(v);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const dv = n => ((([...c.slice(0, n)].reduce((s, ch, i) => s + Number(ch) * (n + 1 - i), 0)) * 10) % 11) % 10;
    return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
  }
  function parseDate(v) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return null;
    const d = +m[1], mo = +m[2], y = +m[3];
    const dt = new Date(y, mo - 1, d, 12);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d || y < 1900) return null;
    const now = new Date();
    if (dt > now) return null;
    let age = now.getFullYear() - y;
    if (now.getMonth() < mo - 1 || (now.getMonth() === mo - 1 && now.getDate() < d)) age--;
    return { age, iso: `${m[3]}-${m[2]}-${m[1]}` };
  }
  $('cpf').addEventListener('input', e => { e.target.value = maskCpf(e.target.value); });
  $('nascimento').addEventListener('input', e => {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e.target.value);
    e.target.value = maskDate(iso ? `${iso[3]}${iso[2]}${iso[1]}` : e.target.value);
  });
  $('telefone').addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });
  $('uf').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2); });

  /* ---------- CEP ---------- */
  const addr = $('addr');
  const cepStatus = $('cepStatus');
  function showAddress() { addr.hidden = false; }
  async function lookupCep(cep) {
    if (cepAbort) cepAbort.abort();
    cepAbort = new AbortController();
    cepStatus.textContent = 'Procurando o endereço…';
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: cepAbort.signal, mode: 'cors', credentials: 'omit', cache: 'no-store' });
      if (!r.ok) throw new Error('indisponível');
      const data = await r.json();
      if (data.erro) throw new Error('não encontrado');
      if (digits($('cep').value) !== cep) return;
      const map = { logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf };
      Object.entries(map).forEach(([k, v]) => { if (v) $(k).value = v; });
      showAddress();
      cepStatus.textContent = 'Endereço encontrado. Confira e informe o número.';
      $('numero').focus({ preventScroll: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      showAddress();
      cepStatus.textContent = 'Não encontramos esse CEP. Digite o endereço manualmente.';
    }
  }
  $('cep').addEventListener('input', e => {
    e.target.value = maskCep(e.target.value);
    const n = digits(e.target.value);
    if (n.length === 8) lookupCep(n);
    else cepStatus.textContent = 'Ao digitar o CEP, preenchemos o endereço para você.';
  });
  $('cepManual').addEventListener('click', () => { showAddress(); $('logradouro').focus(); });

  /* ---------- Condicionais ---------- */
  function syncConditionals() {
    $('condSintomas').hidden = one('sintomas') !== 'Sim';
    $('condFamilia').hidden = one('familia') !== 'Sim';
  }
  form.querySelectorAll('input[name="sintomas"],input[name="familia"]').forEach(el => el.addEventListener('change', syncConditionals));

  /* ---------- Panorama (referência geral por idade) ---------- */
  function mammoView(age, last) {
    if (age < 40) return ['info', 'Para conversar', 'Antes dos 40 anos a mamografia não costuma ser de rotina. Histórico na família ou sintomas podem mudar isso, e a Dra. avalia.'];
    const base = 'Sociedades médicas brasileiras (SBM, CBR e Febrasgo) recomendam uma mamografia por ano a partir dos 40.';
    if (last === 'Nunca fiz') return ['late', 'Vale atualizar', `Você ainda não fez nenhuma. ${base}`];
    if (last === 'Há mais de 2 anos') return ['late', 'Vale atualizar', `Já passou do intervalo recomendado. ${base}`];
    if (last === 'Há 1 a 2 anos') return ['soon', 'Quase na hora', `Está chegando a hora de repetir. ${base}`];
    if (last === 'Há menos de 1 ano') return ['ok', 'Em dia', 'Dentro do intervalo anual recomendado.'];
    return ['soon', 'Quase na hora', `Sem a data, vale conferir o intervalo com a Dra. ${base}`];
  }
  function papView(age, last) {
    if (age < 25) return ['info', 'Para conversar', 'O preventivo costuma começar aos 25 anos. A Dra. confirma o que faz sentido no seu caso.'];
    if (age > 64) return ['info', 'Para conversar', 'Depois dos 64 anos, a Dra. avalia se ainda é necessário, conforme os seus exames anteriores.'];
    const base = 'A orientação do Ministério da Saúde é repetir a cada 3 anos, depois de dois exames normais seguidos.';
    if (last === 'Nunca fiz') return ['late', 'Vale atualizar', `Você ainda não fez. ${base}`];
    if (last === 'Há mais de 3 anos') return ['late', 'Vale atualizar', `Passou do intervalo de 3 anos. ${base}`];
    if (last === 'Há 1 a 3 anos') return ['ok', 'Em dia', 'Dentro do intervalo, se os resultados anteriores foram normais.'];
    if (last === 'Há menos de 1 ano') return ['ok', 'Em dia', 'Feito recentemente.'];
    return ['soon', 'Quase na hora', `Sem a data, vale conferir com a Dra. ${base}`];
  }
  function renderPanorama() {
    const box = $('panorama');
    const dob = parseDate(val('nascimento'));
    const mamo = one('mamografia'), pap = one('preventivo');
    if (!dob || dob.age < 18 || (!mamo && !pap)) { box.hidden = true; return; }
    const rows = [];
    if (mamo) rows.push(['Mamografia', ...mammoView(dob.age, mamo)]);
    if (pap) rows.push(['Preventivo', ...papView(dob.age, pap)]);
    const nome = firstName(val('nome'));
    box.innerHTML = '';
    const mk = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; el.textContent = text; return el; };
    box.append(mk('p', 'pano-k', 'Seu panorama'), mk('h3', '', nome ? `${nome}, olha o que já dá para ver` : 'Olha o que já dá para ver'));
    rows.forEach(([title, tone, label, text]) => {
      const row = mk('div', 'pano-row', '');
      row.append(mk('span', `pill ${tone}`, label), mk('b', '', title), mk('p', '', text));
      box.append(row);
    });
    box.append(mk('p', 'pano-foot', 'Referência geral por faixa etária. O que é indicado para você depende da avaliação médica.'));
    box.hidden = false;
  }
  form.querySelectorAll('input[name="mamografia"],input[name="preventivo"]').forEach(el => el.addEventListener('change', renderPanorama));

  /* ---------- Planos indisponíveis ---------- */
  const planNote = $('planNote');
  document.querySelectorAll('.plan-off').forEach(btn => btn.addEventListener('click', () => {
    planNote.textContent = `${btn.dataset.plan} não está disponível neste atendimento. Siga com a opção Particular, que já está selecionada.`;
    btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap');
  }));

  /* ---------- Validação por passo ---------- */
  function validate(n) {
    clearErrors();
    let ok = true;
    const need = (key, text) => { ok = setError(key, text) && ok; };
    const group = (name, key = name, text = 'Escolha uma opção para continuar.') => { if (!one(name)) need(key, text); };
    if (n === 1) {
      if (val('nome').split(/\s+/).filter(Boolean).length < 2) need('nome', 'Informe seu nome e sobrenome.');
      const dob = parseDate(val('nascimento'));
      if (!dob) need('nascimento', 'Digite a data no formato DD/MM/AAAA.');
      else if (dob.age < 18) need('nascimento', 'Esta ficha é para maiores de 18 anos.');
      else if (dob.age > 115) need('nascimento', 'Confira o ano de nascimento.');
      if (![10, 11].includes(digits(val('telefone')).length)) need('telefone', 'Informe o número com DDD.');
      if (val('email') && !$('email').checkValidity()) need('email', 'Confira o e-mail digitado.');
    }
    if (n === 2) {
      if (!picked('exames').length) need('exames', 'Marque ao menos uma opção.');
      group('mamografia'); group('preventivo');
    }
    if (n === 3) { group('sintomas'); group('pessoal'); group('familia'); group('genetica'); }
    if (n === 4) group('gestacao');
    if (n === 5) {
      if (!validCpf(val('cpf'))) need('cpf', 'Confira o CPF digitado.');
      if (digits(val('cep')).length !== 8) need('cep', 'O CEP tem 8 números.');
      else {
        showAddress();
        if (!val('logradouro')) need('logradouro', 'Informe a rua ou avenida.');
        if (!val('numero')) need('numero', 'Informe o número ou s/n.');
        if (!val('bairro')) need('bairro', 'Informe o bairro.');
        if (!val('cidade')) need('cidade', 'Informe a cidade.');
        if (!/^[A-Za-z]{2}$/.test(val('uf'))) need('uf', 'Use a sigla, como ES.');
      }
    }
    if (n === 6) {
      if (!$('aceite').checked) need('aceite', 'Confirme para gerar a sua ficha.');
      else if (!window.jspdf || !window.jspdf.jsPDF) { alert('O gerador de PDF não carregou. Atualize a página e tente de novo.'); ok = false; }
    }
    if (!ok && setError.first) {
      const { wrap, target } = setError.first;
      wrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      if (target && target.type !== 'radio' && target.type !== 'checkbox') target.focus({ preventScroll: true });
    }
    return ok;
  }

  /* ---------- Navegação ---------- */
  function goTo(n, scroll = true) {
    current = Math.max(1, Math.min(TOTAL, n));
    steps.forEach((s, i) => { s.hidden = i + 1 !== current; });
    wizard.dataset.step = current;
    $('pCur').textContent = current;
    $('pCheer').textContent = CHEER[current - 1];
    $('back').hidden = current === 1;
    $('nextLbl').textContent = current === TOTAL ? 'Concluir ficha' : 'Continuar';
    if (current === 2) renderPanorama();
    if (scroll) {
      const top = wizard.getBoundingClientRect().top + scrollY - 92;
      scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
      const h = steps[current - 1].querySelector('h2'); if (h) h.focus({ preventScroll: true });
    }
  }
  $('next').addEventListener('click', () => {
    if (!validate(current)) return;
    if (current === TOTAL) finish(); else goTo(current + 1);
  });
  $('back').addEventListener('click', () => goTo(current - 1));
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input[type=text],input[type=tel],input[type=email]')) { e.preventDefault(); $('next').click(); }
  });
  form.addEventListener('submit', e => e.preventDefault());

  /* ---------- Dados ---------- */
  function snapshot() {
    const dob = parseDate(val('nascimento'));
    const fam = one('familia') === 'Sim';
    const na = 'Não informado';
    return {
      nome: val('nome').replace(/\s+/g, ' '), cpf: val('cpf'), nascimento: dob ? dob.iso.split('-').reverse().join('/') : '', idade: dob ? dob.age : 0,
      telefone: val('telefone'), email: val('email') || na,
      cep: val('cep'), logradouro: val('logradouro'), numero: val('numero'), complemento: val('complemento') || '—',
      bairro: val('bairro'), cidade: val('cidade'), uf: val('uf').toUpperCase(),
      exames: picked('exames'), mamografia: one('mamografia'), preventivo: one('preventivo'),
      sintomas: one('sintomas'), sinais: picked('sinais').join(', ') || 'Não especificados',
      pessoal: one('pessoal'), familia: one('familia'),
      parentes: fam ? (picked('parentes').join(', ') || 'Não especificados') : 'Não se aplica',
      familiaTipo: fam ? (val('familiaTipo') || na) : 'Não se aplica',
      genetica: one('genetica'), gestacao: one('gestacao'),
      menopausa: one('menopausa') || na, hormonio: one('hormonio') || na, protese: one('protese') || na,
      obs: val('obs') || '—', modalidade: 'Particular'
    };
  }
  function attention(d) {
    const out = [];
    if (d.sintomas === 'Sim') out.push(`Relata alteração mamária atual (${d.sinais}). Priorizar contato.`);
    if (d.pessoal === 'Sim') out.push('Histórico pessoal de câncer de mama ou ovário.');
    if (d.familia === 'Sim') out.push(`Familiar de primeiro grau com câncer de mama ou ovário (${d.parentes}; ${d.familiaTipo}).`);
    if (d.genetica === 'Sim') out.push('Mutação genética de risco conhecida na família.');
    if (d.idade >= 40 && (d.mamografia === 'Nunca fiz' || d.mamografia === 'Há mais de 2 anos')) out.push(`Mamografia: ${d.mamografia.toLowerCase()} (idade ${d.idade}).`);
    if (d.idade >= 25 && d.idade <= 64 && (d.preventivo === 'Nunca fiz' || d.preventivo === 'Há mais de 3 anos')) out.push(`Preventivo: ${d.preventivo.toLowerCase()}.`);
    if (d.gestacao === 'Estou grávida' || d.gestacao === 'Estou amamentando') out.push(`${d.gestacao}. Considerar na escolha do exame de imagem.`);
    if (d.protese !== 'Não' && d.protese !== 'Não informado') out.push(`${d.protese}. Informar ao serviço de imagem.`);
    return out;
  }
  function textSummary(d) {
    const lines = [
      'Olá, Dra. Joyce! Concluí a ficha do Outubro Rosa.', '',
      `Nome: ${d.nome}`, `CPF: ${d.cpf}`, `Nascimento: ${d.nascimento} (${d.idade} anos)`, `WhatsApp: ${d.telefone}`, `E-mail: ${d.email}`,
      `Endereço: ${d.logradouro}, ${d.numero}${d.complemento !== '—' ? ' · ' + d.complemento : ''} · ${d.bairro} · ${d.cidade}/${d.uf} · CEP ${d.cep}`, '',
      `Procuro: ${d.exames.join('; ')}`, `Última mamografia: ${d.mamografia}`, `Último preventivo: ${d.preventivo}`,
      `Alteração nas mamas: ${d.sintomas}${d.sintomas === 'Sim' ? ' (' + d.sinais + ')' : ''}`,
      `Câncer de mama/ovário pessoal: ${d.pessoal}`, `Familiar de 1º grau: ${d.familia}${d.familia === 'Sim' ? ' (' + d.parentes + '; ' + d.familiaTipo + ')' : ''}`,
      `Mutação genética na família: ${d.genetica}`, `Gestação/amamentação: ${d.gestacao}`,
      `Ciclo: ${d.menopausa}`, `Hormônios: ${d.hormonio}`, `Prótese/cirurgia mamária: ${d.protese}`
    ];
    if (d.obs !== '—') lines.push(`Observação: ${d.obs}`);
    lines.push('', 'Atendimento: particular.');
    return lines.join('\n');
  }

  /* ---------- PDF ---------- */
  function createPdf(d) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    pdf.setProperties({ title: 'Ficha Outubro Rosa | Dra. Joyce Radis', subject: 'Informações declaradas pela paciente para avaliação clínica', creator: 'Dra. Joyce Radis' });
    const W = 210, H = 297, L = 20, R = 20, U = W - L - R;
    const C = { wine: [109, 42, 66], rose: [180, 84, 111], blush: [249, 230, 234], ink: [58, 37, 48], muted: [125, 106, 114], line: [232, 212, 217], amber: [250, 236, 214] };
    const stamp = new Date().toLocaleString('pt-BR');
    let y = 0, page = 0;

    function petal(cx, cy, ang, len, wid, fill) {
      const rot = (px, py) => [cx + px * Math.cos(ang) - py * Math.sin(ang), cy + px * Math.sin(ang) + py * Math.cos(ang)];
      const p0 = rot(0, 0), c1 = rot(-wid, -len * .35), c2 = rot(-wid * .8, -len * .95), t = rot(0, -len * .9);
      const c3 = rot(wid * .8, -len * .95), c4 = rot(wid, -len * .35);
      pdf.setFillColor(...fill);
      const rel = (a, b) => [b[0] - a[0], b[1] - a[1]];
      pdf.lines([[...rel(p0, c1), ...rel(p0, c2), ...rel(p0, t)], [...rel(t, c3), ...rel(t, c4), ...rel(t, p0)]], p0[0], p0[1], [1, 1], 'F', true);
    }
    function blossom(cx, cy, size) {
      for (let i = 0; i < 5; i++) petal(cx, cy, (i * 72 + 8) * Math.PI / 180, size, size * .55, i % 2 ? [244, 205, 214] : [236, 176, 191]);
      pdf.setFillColor(222, 170, 105); pdf.circle(cx, cy, size * .12, 'F');
    }
    function header() {
      page++;
      if (page === 1) {
        blossom(W - 34, 24, 11); blossom(W - 20, 36, 6.5);
        pdf.setTextColor(...C.wine); pdf.setFont('times', 'normal'); pdf.setFontSize(24); pdf.text('Dra. Joyce Radis', L, 24);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.6); pdf.setTextColor(...C.muted); pdf.setCharSpace(.5);
        pdf.text('MÉDICA · CRM-ES 21188', L, 30); pdf.setCharSpace(0);
        pdf.setDrawColor(...C.rose); pdf.setLineWidth(.5); pdf.line(L, 42, L + 18, 42);
        pdf.setFont('times', 'italic'); pdf.setFontSize(15); pdf.setTextColor(...C.ink); pdf.text('Ficha de pré-avaliação · Outubro Rosa 2026', L, 52);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.4); pdf.setTextColor(...C.muted);
        pdf.text('Declarada pela paciente. Este documento não é pedido médico.', L, 58);
        y = 70;
      } else {
        pdf.setFont('times', 'normal'); pdf.setFontSize(11); pdf.setTextColor(...C.wine); pdf.text('Dra. Joyce Radis', L, 16);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...C.muted); pdf.text('Ficha Outubro Rosa · ' + d.nome, W - R, 16, { align: 'right' });
        pdf.setDrawColor(...C.line); pdf.setLineWidth(.3); pdf.line(L, 20, W - R, 20);
        y = 32;
      }
    }
    function footer() {
      pdf.setDrawColor(...C.line); pdf.setLineWidth(.3); pdf.line(L, H - 20, W - R, H - 20);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.2); pdf.setTextColor(...C.muted);
      pdf.text('Documento confidencial. Encaminhar apenas à médica responsável.', L, H - 14.5);
      pdf.text('Gerado em ' + stamp, L, H - 10.5);
      pdf.text('Página ' + page, W - R, H - 14.5, { align: 'right' });
    }
    function room(h) { if (y + h > H - 28) { footer(); pdf.addPage(); header(); } }
    function section(n, title) {
      room(20);
      pdf.setFont('times', 'italic'); pdf.setFontSize(12); pdf.setTextColor(...C.rose); pdf.text(n, L, y);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.6); pdf.setTextColor(...C.wine); pdf.setCharSpace(.6);
      pdf.text(title.toUpperCase(), L + 9, y); pdf.setCharSpace(0);
      pdf.setDrawColor(...C.line); pdf.setLineWidth(.3); pdf.line(L, y + 2.6, W - R, y + 2.6);
      y += 10;
    }
    const wrap = (s, w, size) => { pdf.setFontSize(size); return pdf.splitTextToSize(String(s || 'Não informado'), w); };
    function item(label, value) {
      const lines = wrap(value, U, 10);
      room(9 + lines.length * 4.7);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.4); pdf.setTextColor(...C.muted); pdf.setCharSpace(.3); pdf.text(label.toUpperCase(), L, y); pdf.setCharSpace(0);
      y += 4.8; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(...C.ink); pdf.text(lines, L, y);
      y += lines.length * 4.7 + 3.4;
    }
    function pair(l1, v1, l2, v2) {
      const half = U / 2 - 4, a = wrap(v1, half, 10), b = wrap(v2, half, 10), n = Math.max(a.length, b.length);
      room(9 + n * 4.7);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.4); pdf.setTextColor(...C.muted); pdf.setCharSpace(.3);
      pdf.text(l1.toUpperCase(), L, y); pdf.text(l2.toUpperCase(), L + U / 2 + 2, y); pdf.setCharSpace(0);
      y += 4.8; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(...C.ink);
      pdf.text(a, L, y); pdf.text(b, L + U / 2 + 2, y);
      y += n * 4.7 + 3.4;
    }

    header();
    const flags = attention(d);
    const flagLines = flags.flatMap(f => wrap('•  ' + f, U - 12, 9.2));
    const boxH = 14 + (flags.length ? flagLines.length * 4.4 : 4.4);
    room(boxH + 6);
    pdf.setFillColor(...(flags.length ? C.amber : C.blush)); pdf.roundedRect(L, y - 4, U, boxH, 3, 3, 'F');
    pdf.setFillColor(...(flags.length ? [217, 154, 74] : C.rose)); pdf.rect(L, y - 4, 1.4, boxH, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.8); pdf.setTextColor(...C.wine); pdf.setCharSpace(.6);
    pdf.text('PONTOS DE ATENÇÃO PARA A MÉDICA', L + 6, y + 2); pdf.setCharSpace(0);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.2); pdf.setTextColor(...C.ink);
    pdf.text(flags.length ? flagLines : ['Nenhum ponto de atenção assinalado nas respostas.'], L + 6, y + 8.4);
    y += boxH + 8;

    section('1', 'Identificação');
    item('Nome completo', d.nome);
    pair('CPF', d.cpf, 'Nascimento', `${d.nascimento} · ${d.idade} anos`);
    pair('WhatsApp', d.telefone, 'E-mail', d.email);
    y += 2; section('2', 'Endereço');
    item('Logradouro', `${d.logradouro}, ${d.numero}${d.complemento !== '—' ? ' · ' + d.complemento : ''}`);
    pair('Bairro', d.bairro, 'Cidade / UF', `${d.cidade} / ${d.uf}`);
    item('CEP', d.cep);
    y += 2; section('3', 'Histórico informado');
    pair('Alteração mamária atual', d.sintomas, 'Câncer de mama/ovário pessoal', d.pessoal);
    if (d.sintomas === 'Sim') item('Sintomas assinalados', d.sinais);
    pair('Familiar de 1º grau', d.familia, 'Mutação genética na família', d.genetica);
    if (d.familia === 'Sim') { item('Familiares', d.parentes); item('Tipo de câncer e idade', d.familiaTipo); }
    pair('Gestação / amamentação', d.gestacao, 'Ciclo', d.menopausa);
    pair('Hormônios', d.hormonio, 'Prótese / cirurgia mamária', d.protese);
    pair('Última mamografia', d.mamografia, 'Último preventivo', d.preventivo);
    y += 2; section('4', 'Solicitação');
    item('Orientação procurada', d.exames.join('; '));
    item('Modalidade', 'Particular, sem credenciamento a operadoras de saúde');
    if (d.obs !== '—') item('Observação da paciente', d.obs);
    room(26);
    y += 2; pdf.setFillColor(...C.blush); pdf.roundedRect(L, y, U, 22, 3, 3, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.8); pdf.setTextColor(...C.rose); pdf.setCharSpace(.6); pdf.text('IMPORTANTE', L + 6, y + 6.5); pdf.setCharSpace(0);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.2); pdf.setTextColor(...C.ink);
    pdf.text(wrap('Documento com informações declaradas pela paciente. Não constitui consulta, laudo, prescrição, pedido de exame nem assinatura médica. A avaliação e a emissão de pedidos são independentes.', U - 12, 8.2).slice(0, 3), L + 6, y + 12);
    footer();
    const slug = d.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').slice(0, 34).toLowerCase();
    return new File([pdf.output('blob')], `outubro-rosa-ficha-${slug}.pdf`, { type: 'application/pdf' });
  }

  /* ---------- Resultado ---------- */
  let ficha = null;
  function finish() {
    const d = snapshot();
    try { ficha = { d, file: createPdf(d) }; }
    catch (err) { alert('Não foi possível gerar o PDF. Atualize a página e tente de novo.'); return; }
    wizard.hidden = true;
    $('rName').textContent = firstName(d.nome) || 'você';
    $('rAttn').hidden = d.sintomas !== 'Sim';
    $('waText').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(textSummary(d))}`;
    $('result').hidden = false;
    $('result').focus({ preventScroll: true });
    scrollTo({ top: Math.max(0, $('result').getBoundingClientRect().top + scrollY - 90), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function saveFile(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  $('download').addEventListener('click', () => { if (ficha) saveFile(ficha.file); });
  $('share').addEventListener('click', async () => {
    if (!ficha) return;
    try {
      if (navigator.canShare && navigator.canShare({ files: [ficha.file] })) {
        await navigator.share({ files: [ficha.file], title: 'Ficha Outubro Rosa | Dra. Joyce Radis', text: 'Ficha confidencial para avaliação médica individual.' });
      } else {
        saveFile(ficha.file);
        $('shareHint').textContent = 'Seu PDF foi baixado. Abra a conversa com a Dra. Joyce no WhatsApp e anexe o arquivo, ou use o envio por mensagem de texto abaixo.';
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') $('shareHint').textContent = 'Não foi possível abrir o compartilhamento. Toque em Baixar PDF ou envie como mensagem de texto.';
    }
  });
  $('editAgain').addEventListener('click', () => { $('result').hidden = true; wizard.hidden = false; goTo(TOTAL); });
  $('shareFriend').addEventListener('click', async () => {
    const data = { title: 'Seus exames estão em dia?', text: 'Fiz minha ficha do Outubro Rosa com a Dra. Joyce Radis. Leva 3 minutos e ela prepara seus pedidos de exame:', url: CONFIG.siteUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); $('shareFriend').textContent = 'Link copiado. É só colar na conversa.'; }
    } catch (err) { /* cancelado */ }
  });

  /* ---------- Diálogos e Pix ---------- */
  const pix = $('pixDialog'), priv = $('privacyDialog');
  const open = dlg => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };
  document.querySelectorAll('[data-open-pix]').forEach(b => b.addEventListener('click', () => open(pix)));
  $('openPrivacy').addEventListener('click', () => open(priv));
  $('openPrivacy2').addEventListener('click', () => open(priv));
  document.querySelectorAll('dialog').forEach(dlg => {
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close(); });
  });
  async function copy(text, btn, label) {
    const fb = $('pixFb'), span = btn.querySelector('span');
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); document.body.append(t); t.select();
      const ok = document.execCommand('copy'); t.remove();
      if (!ok) { fb.textContent = 'Não foi possível copiar. Use o QR Code acima.'; return; }
    }
    span.textContent = 'Copiado, obrigada!'; fb.textContent = 'Copiado para a área de transferência.';
    setTimeout(() => { span.textContent = label; fb.textContent = ''; }, 2400);
  }
  $('copyPayload').addEventListener('click', e => copy(CONFIG.pixPayload, e.currentTarget, 'Copiar Pix copia e cola'));
  $('copyEmail').addEventListener('click', e => copy(CONFIG.pixEmail, e.currentTarget, 'Copiar chave por e-mail'));

  goTo(1, false);
})();
