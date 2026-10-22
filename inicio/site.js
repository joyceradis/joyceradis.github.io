/* Site da Dra. Joyce Radis.
   O destaque do Outubro Rosa aparece só até 31 de outubro.
   Quando houver link do Calendly, coloque em AGENDA e todos os botões "Agendar" passam a usá-lo. */
const AGENDA = '';

const fimCampanha = new Date('2026-11-01T00:00:00-03:00');
if (new Date() < fimCampanha) document.getElementById('campanha').hidden = false;

if (AGENDA) document.querySelectorAll('[data-agendar]').forEach(a => { a.href = AGENDA; });

document.querySelectorAll('a[href^="https://"]').forEach(a => {
  if (!a.href.startsWith(location.origin)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
});
