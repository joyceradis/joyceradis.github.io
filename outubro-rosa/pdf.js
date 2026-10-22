/* Geração do PDF no aparelho, com a biblioteca jsPDF carregada em window.jspdf. */
import { attention, display } from './ficha.js';

const C = {
  wine: [74, 32, 55], rose: [178, 63, 119], blush: [253, 232, 240], ink: [61, 34, 49],
  muted: [116, 95, 108], line: [236, 211, 223], amber: [250, 236, 214]
};
const { orNA } = display;

/** @returns {File} PDF com os dados da ficha. */
export function createPdf(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: 'Ficha Outubro Rosa | Dra. Joyce Radis', subject: 'Informações declaradas pela paciente para avaliação clínica', creator: 'Dra. Joyce Radis' });
  const W = 210, H = 297, L = 20, U = W - L * 2;
  const stamp = new Date().toLocaleString('pt-BR');
  let y = 0, page = 0;

  const text = (s, x, yy, o) => pdf.text(s, x, yy, o);
  const font = (style, size, color) => { pdf.setFont(...style); pdf.setFontSize(size); pdf.setTextColor(...color); };
  const wrap = (s, w, size) => { pdf.setFontSize(size); return pdf.splitTextToSize(orNA(s), w); };

  function petal(cx, cy, ang, len, wid, fill) {
    const rot = (px, py) => [cx + px * Math.cos(ang) - py * Math.sin(ang), cy + px * Math.sin(ang) + py * Math.cos(ang)];
    const p0 = rot(0, 0), c1 = rot(-wid, -len * .35), c2 = rot(-wid * .8, -len * .95), t = rot(0, -len * .9), c3 = rot(wid * .8, -len * .95), c4 = rot(wid, -len * .35);
    const rel = (a, b) => [b[0] - a[0], b[1] - a[1]];
    pdf.setFillColor(...fill);
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
      font(['times', 'normal'], 24, C.wine); text('Dra. Joyce Radis', L, 24);
      font(['helvetica', 'normal'], 7.6, C.muted); pdf.setCharSpace(.5); text('MÉDICA · CRM-ES 21188', L, 30); pdf.setCharSpace(0);
      pdf.setDrawColor(...C.rose); pdf.setLineWidth(.5); pdf.line(L, 42, L + 18, 42);
      font(['times', 'italic'], 15, C.ink); text('Ficha de pré-avaliação · Ação Outubro Rosa 2026', L, 52);
      font(['helvetica', 'normal'], 8.4, C.muted); text('Declarada pela paciente. Este documento não é pedido médico.', L, 58);
      y = 70;
    } else {
      font(['times', 'normal'], 11, C.wine); text('Dra. Joyce Radis', L, 16);
      font(['helvetica', 'normal'], 8, C.muted); text(`Ficha Outubro Rosa · ${orNA(d.nome)}`, W - L, 16, { align: 'right' });
      pdf.setDrawColor(...C.line); pdf.setLineWidth(.3); pdf.line(L, 20, W - L, 20);
      y = 32;
    }
  }
  function footer() {
    pdf.setDrawColor(...C.line); pdf.setLineWidth(.3); pdf.line(L, H - 20, W - L, H - 20);
    font(['helvetica', 'normal'], 7.2, C.muted);
    text('Documento confidencial. Encaminhar apenas à médica responsável.', L, H - 14.5);
    text(`Gerado em ${stamp}`, L, H - 10.5);
    text(`Página ${page}`, W - L, H - 14.5, { align: 'right' });
  }
  const room = h => { if (y + h > H - 28) { footer(); pdf.addPage(); header(); } };

  function section(n, title) {
    room(20);
    font(['times', 'italic'], 12, C.rose); text(String(n), L, y);
    font(['helvetica', 'bold'], 8.6, C.wine); pdf.setCharSpace(.6); text(title.toUpperCase(), L + 9, y); pdf.setCharSpace(0);
    pdf.setDrawColor(...C.line); pdf.setLineWidth(.3); pdf.line(L, y + 2.6, W - L, y + 2.6);
    y += 10;
  }
  function label(s, x) { font(['helvetica', 'bold'], 7.4, C.muted); pdf.setCharSpace(.3); text(s.toUpperCase(), x, y); pdf.setCharSpace(0); }
  function item(lab, value) {
    const lines = wrap(value, U, 10);
    room(9 + lines.length * 4.7);
    label(lab, L); y += 4.8;
    font(['helvetica', 'normal'], 10, C.ink); text(lines, L, y);
    y += lines.length * 4.7 + 3.4;
  }
  function pair(l1, v1, l2, v2) {
    const half = U / 2 - 4, a = wrap(v1, half, 10), b = wrap(v2, half, 10), n = Math.max(a.length, b.length);
    room(9 + n * 4.7);
    label(l1, L); label(l2, L + U / 2 + 2); y += 4.8;
    font(['helvetica', 'normal'], 10, C.ink); text(a, L, y); text(b, L + U / 2 + 2, y);
    y += n * 4.7 + 3.4;
  }

  header();

  const flags = attention(d);
  const flagLines = flags.flatMap(f => wrap(`•  ${f}`, U - 12, 9.2));
  const boxH = 14 + (flags.length ? flagLines.length * 4.4 : 4.4);
  room(boxH + 6);
  pdf.setFillColor(...(flags.length ? C.amber : C.blush)); pdf.roundedRect(L, y - 4, U, boxH, 3, 3, 'F');
  pdf.setFillColor(...(flags.length ? [217, 154, 74] : C.rose)); pdf.rect(L, y - 4, 1.4, boxH, 'F');
  font(['helvetica', 'bold'], 7.8, C.wine); pdf.setCharSpace(.6); text('PONTOS DE ATENÇÃO PARA A MÉDICA', L + 6, y + 2); pdf.setCharSpace(0);
  font(['helvetica', 'normal'], 9.2, C.ink); text(flags.length ? flagLines : ['Nenhum ponto de atenção assinalado nas respostas.'], L + 6, y + 8.4);
  y += boxH + 8;

  section(1, 'Identificação');
  item('Nome completo', d.nome);
  pair('CPF', d.cpf, 'Nascimento', d.idade ? `${d.nascimento} · ${d.idade} anos` : '');
  item('WhatsApp', d.telefone);

  y += 2; section(2, 'Endereço');
  item('Logradouro', d.logradouro ? `${d.logradouro}, ${d.numero || 's/n'}${d.complemento ? ` · ${d.complemento}` : ''}` : '');
  pair('Bairro', d.bairro, 'Cidade / UF', d.cidade ? `${d.cidade} / ${d.uf}` : '');
  item('CEP', d.cep);

  y += 2; section(3, 'Histórico informado');
  pair('Alteração mamária atual', d.sintomas, 'Câncer de mama/ovário pessoal', d.pessoal);
  if (d.sintomas === 'Sim') item('Sintomas assinalados', d.sinais.join(', ') || 'Não especificados');
  pair('Câncer de mama/ovário na família', d.familia, 'Mutação genética na família', d.genetica);
  if (d.familia === 'Sim') { item('Parentes', d.parentes.join(', ') || 'Não especificados'); item('Tipo de câncer e idade', d.familiaTipo); }
  pair('Prótese mamária', d.protese, 'Gestação / amamentação', d.gestacao);
  pair('Ciclo', d.ciclo, 'Hormônios', d.hormonio);
  pair('Última mamografia', d.mamografia, 'Último ultrassom das mamas', d.ultrassom);
  item('Último preventivo', d.preventivo);

  y += 2; section(4, 'Solicitação');
  item('Orientação procurada', d.exames.join('; '));
  item('Modalidade', 'Particular, sem credenciamento a operadoras de saúde');
  if (d.obs) item('Observação da paciente', d.obs);

  room(26); y += 2;
  pdf.setFillColor(...C.blush); pdf.roundedRect(L, y, U, 22, 3, 3, 'F');
  font(['helvetica', 'bold'], 7.8, C.rose); pdf.setCharSpace(.6); text('IMPORTANTE', L + 6, y + 6.5); pdf.setCharSpace(0);
  font(['helvetica', 'normal'], 8.2, C.ink);
  text(wrap('Documento com informações declaradas pela paciente. Não constitui consulta, laudo, prescrição, pedido de exame nem assinatura médica. A avaliação e a emissão de pedidos são independentes.', U - 12, 8.2).slice(0, 3), L + 6, y + 12);
  footer();

  const slug = (d.nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').slice(0, 34).toLowerCase() || 'paciente';
  return new File([pdf.output('blob')], `outubro-rosa-ficha-${slug}.pdf`, { type: 'application/pdf' });
}
