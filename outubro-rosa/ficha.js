/* Dados da ficha: máscaras, validações, regras clínicas e resumo em texto.
   Sem acesso ao DOM além de ler o formulário em readData(). */

export const digits = v => String(v ?? '').replace(/\D/g, '');

export const maskCpf = v => digits(v).slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const maskCep = v => {
  const n = digits(v).slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
};

export const maskDate = v => {
  const n = digits(v).slice(0, 8);
  return n.length > 4 ? `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}` : n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
};

export function maskPhone(v) {
  const n = digits(v).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
  if (n.length <= 2) return n ? `(${n}` : '';
  const cut = n.length > 10 ? 7 : 6;
  return n.length <= 6 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : `(${n.slice(0, 2)}) ${n.slice(2, cut)}-${n.slice(cut)}`;
}

export function validCpf(v) {
  const c = digits(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = n => (([...c.slice(0, n)].reduce((s, ch, i) => s + Number(ch) * (n + 1 - i), 0) * 10) % 11) % 10;
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

/** Lê DD/MM/AAAA e devolve { age, br } ou null se a data não existir. */
export function parseDate(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  const [d, mo, y] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d, 12), now = new Date();
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d || y < 1900 || dt > now) return null;
  let age = now.getFullYear() - y;
  if (now.getMonth() < mo - 1 || (now.getMonth() === mo - 1 && now.getDate() < d)) age--;
  return { age, br: v };
}

export const firstName = full =>
  (full.trim().split(/\s+/)[0] || '').replace(/^./, c => c.toLocaleUpperCase('pt-BR'));

/** Lê o formulário e devolve um objeto simples, sem valores nulos. */
export function readData(form) {
  const val = n => (form.elements[n]?.value ?? '').trim();
  const all = n => [...form.querySelectorAll(`[name="${n}"]:checked`)].map(e => e.value);
  const dob = parseDate(val('nascimento'));
  return {
    nome: val('nome').replace(/\s+/g, ' '), telefone: val('telefone'), cpf: val('cpf'),
    nascimento: dob ? dob.br : '', idade: dob ? dob.age : 0,
    cep: val('cep'), logradouro: val('logradouro'), numero: val('numero'), complemento: val('complemento'),
    bairro: val('bairro'), cidade: val('cidade'), uf: val('uf').toUpperCase(),
    exames: all('exames'), protese: val('protese'),
    mamografia: val('mamografia'), ultrassom: val('ultrassom'), preventivo: val('preventivo'),
    sintomas: val('sintomas'), sinais: all('sinais'),
    pessoal: val('pessoal'), familia: val('familia'), parentes: all('parentes'), familiaTipo: val('familiaTipo'),
    genetica: val('genetica'), gestacao: val('gestacao'), ciclo: val('ciclo'), hormonio: val('hormonio'),
    obs: val('obs'), modalidade: 'Particular'
  };
}

const orNA = v => (v && String(v).trim()) || 'Não informado';
export const display = { orNA };

/* ---------- Panorama por idade ---------- */

const INTERVAL = {
  'Nunca fiz': ['late', 'Vale atualizar', 'Ainda não feito.'],
  'Há mais de 2 anos': ['late', 'Vale atualizar', 'Passou do intervalo anual.'],
  'Há mais de 3 anos': ['late', 'Vale atualizar', 'Passou de 3 anos.'],
  'Há 1 a 2 anos': ['soon', 'Quase na hora', 'Está chegando a hora de repetir.'],
  'Há 1 a 3 anos': ['ok', 'Em dia', 'Dentro do intervalo.'],
  'Há menos de 1 ano': ['ok', 'Em dia', 'Feito recentemente.'],
  'Não me lembro': ['soon', 'Vale conferir', 'Sem data, a Dra. confere com você.']
};
const info = text => ['info', 'Para conversar', text];

/** Resumo por idade para mama (a partir dos 35, na rotina da Dra.) e preventivo (25 a 64). */
export function panorama(d) {
  if (!d.idade || d.idade < 18) return null;
  const rows = [];
  const breast = (name, last) => {
    if (!last) return;
    if (d.idade < 30) return rows.push([name, ...info('Ainda não costuma ser de rotina. Histórico ou sintomas mudam isso.')]);
    if (d.idade < 35) return rows.push([name, ...info('Entre 30 e 34 anos, depende do histórico. A Dra. avalia.')]);
    rows.push([name, ...INTERVAL[last]]);
  };
  breast('Mamografia', d.mamografia);
  breast('Ultrassom das mamas', d.ultrassom);
  if (d.preventivo) {
    if (d.idade < 25) rows.push(['Preventivo', ...info('Costuma começar aos 25 anos.')]);
    else if (d.idade > 64) rows.push(['Preventivo', ...info('Depois dos 64, a Dra. avalia se ainda é necessário.')]);
    else rows.push(['Preventivo', ...INTERVAL[d.preventivo]]);
  }
  if (!rows.length) return null;
  const foot = d.protese === 'Sim'
    ? 'Com prótese, o acompanhamento costuma combinar ultrassom e mamografia com técnica própria. A Dra. define o que fazer.'
    : 'Referência geral. Quem define o que é indicado para você é a Dra. Joyce.';
  return { rows: rows.map(([name, tone, label, text]) => ({ name, tone, label, text })), foot };
}

/* ---------- Pontos de atenção e pendências ---------- */

export function attention(d) {
  const out = [];
  if (d.sintomas === 'Sim') out.push(`Alteração mamária atual${d.sinais.length ? ` (${d.sinais.join(', ')})` : ''}. Priorizar contato.`);
  if (d.pessoal === 'Sim') out.push('Histórico pessoal de câncer de mama ou ovário.');
  if (d.familia === 'Sim') out.push(`Câncer de mama ou ovário na família${d.parentes.length ? ` (${d.parentes.join(', ')})` : ''}${d.familiaTipo ? `: ${d.familiaTipo}` : ''}.`);
  if (d.genetica === 'Sim') out.push('Mutação genética de risco conhecida na família.');
  if (d.protese === 'Sim') out.push('Prótese mamária. Informar ao serviço de imagem.');
  if (d.idade >= 35) {
    const late = ['Nunca fiz', 'Há mais de 2 anos'];
    if (late.includes(d.mamografia)) out.push(`Mamografia: ${d.mamografia.toLowerCase()}.`);
    if (late.includes(d.ultrassom)) out.push(`Ultrassom das mamas: ${d.ultrassom.toLowerCase()}.`);
  }
  if (d.idade >= 25 && d.idade <= 64 && ['Nunca fiz', 'Há mais de 3 anos'].includes(d.preventivo)) out.push(`Preventivo: ${d.preventivo.toLowerCase()}.`);
  if (d.gestacao === 'Grávida' || d.gestacao === 'Amamentando') out.push(`${d.gestacao}. Considerar na escolha do exame de imagem.`);
  return out;
}

/** Lista o que ficou em branco, só para avisar antes de gerar. Nada bloqueia. */
export function missing(d) {
  const out = [];
  if (d.nome.split(' ').filter(Boolean).length < 2) out.push('nome completo');
  if (!d.nascimento) out.push('data de nascimento');
  if (![10, 11].includes(digits(d.telefone).length)) out.push('WhatsApp');
  if (!d.exames.length) out.push('exames que procura');
  if (!d.sintomas || !d.pessoal || !d.familia || !d.genetica) out.push('histórico de saúde');
  if (!validCpf(d.cpf)) out.push('CPF');
  if (!(digits(d.cep).length === 8 && d.logradouro && d.numero && d.bairro && d.cidade && d.uf.length === 2)) out.push('endereço');
  return out;
}

/* ---------- Resumo em texto (alternativa ao PDF) ---------- */

export function textSummary(d) {
  const na = orNA;
  const addr = [d.logradouro && `${d.logradouro}, ${d.numero || 's/n'}`, d.complemento, d.bairro, d.cidade && `${d.cidade}/${d.uf}`, d.cep && `CEP ${d.cep}`].filter(Boolean).join(' · ');
  const lines = [
    'Olá, Dra. Joyce! Concluí a ficha da Ação Outubro Rosa.', '',
    `Nome: ${na(d.nome)}`, `CPF: ${na(d.cpf)}`, `Nascimento: ${na(d.nascimento)}${d.idade ? ` (${d.idade} anos)` : ''}`, `WhatsApp: ${na(d.telefone)}`,
    `Endereço: ${na(addr)}`, '',
    `Procuro: ${d.exames.join('; ') || 'Não informado'}`, `Prótese mamária: ${na(d.protese)}`,
    `Última mamografia: ${na(d.mamografia)}`, `Último ultrassom das mamas: ${na(d.ultrassom)}`, `Último preventivo: ${na(d.preventivo)}`,
    `Alteração nas mamas: ${na(d.sintomas)}${d.sintomas === 'Sim' && d.sinais.length ? ` (${d.sinais.join(', ')})` : ''}`,
    `Câncer de mama/ovário pessoal: ${na(d.pessoal)}`,
    `Câncer de mama/ovário na família: ${na(d.familia)}${d.familia === 'Sim' ? ` (${[d.parentes.join(', '), d.familiaTipo].filter(Boolean).join('; ') || 'sem detalhes'})` : ''}`,
    `Mutação genética na família: ${na(d.genetica)}`, `Gestação/amamentação: ${na(d.gestacao)}`,
    `Ciclo: ${na(d.ciclo)}`, `Hormônios: ${na(d.hormonio)}`
  ];
  if (d.obs) lines.push(`Observação: ${d.obs}`);
  lines.push('', 'Atendimento: particular.');
  return lines.join('\n');
}
