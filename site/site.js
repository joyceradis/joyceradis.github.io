/* Site da Dra. Joyce Radis: menu, cabeçalho, revelação ao rolar e faixa do Outubro Rosa.
   AGENDA: quando houver link do Calendly, coloque aqui e os botões de consulta passam a usá-lo. */
const AGENDA = '';
const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Faixa do Outubro Rosa só até 31/10/2026
if (new Date() < new Date('2026-11-01T00:00:00-03:00')) document.getElementById('campanha').hidden = false;

if (AGENDA) document.querySelectorAll('[data-agendar]').forEach(a => { a.href = AGENDA; });

// Links externos em nova aba
document.querySelectorAll('a[href^="https://"]').forEach(a => {
  if (!a.href.startsWith(location.origin)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
});

// Cabeçalho ganha fundo ao rolar
const cab = document.getElementById('top');
const onScroll = () => cab.classList.toggle('solido', scrollY > 24);
onScroll(); addEventListener('scroll', onScroll, { passive: true });

// Menu do celular
const burger = document.getElementById('burger');
burger.addEventListener('click', () => {
  const aberto = document.body.classList.toggle('menu-aberto');
  burger.setAttribute('aria-expanded', aberto);
  burger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
});
document.querySelectorAll('#menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-aberto')));
addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('menu-aberto'); });

// Revelação suave ao rolar
const itens = document.querySelectorAll('.reveal');
if (reduz || !('IntersectionObserver' in window)) itens.forEach(el => el.classList.add('in'));
else {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  itens.forEach((el, i) => { el.style.setProperty('--i', i % 4); io.observe(el); });
}

// Foto da abertura com leve profundidade ao rolar
const foto = document.querySelector('.hero-foto img');
if (foto && !reduz) {
  let pend = false;
  addEventListener('scroll', () => {
    if (pend) return; pend = true;
    requestAnimationFrame(() => { foto.style.transform = `translateY(${Math.min(scrollY, 600) * 0.12}px) scale(1.02)`; pend = false; });
  }, { passive: true });
}
