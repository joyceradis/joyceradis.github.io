"""Gera as páginas do site da Dra. Joyce Radis a partir de um modelo comum.

Uso: python3 site/build.py  (na raiz do repositório)
Edite os textos aqui e rode de novo; os arquivos index.html são sobrescritos.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WA = 'https://wa.me/5527998134032?text='
WA_CONSULTA = WA + 'Ol%C3%A1%2C%20Dra.%20Joyce!%20Gostaria%20de%20agendar%20uma%20consulta.'
WA_CASA = WA + 'Ol%C3%A1%2C%20Dra.%20Joyce!%20Gostaria%20de%20saber%20sobre%20o%20atendimento%20em%20casa.'
V = "5"

NAV = [('/', 'Início'), ('/sobre/', 'Sobre'), ('/atendimentos/', 'Atendimentos'), ('/domiciliar/', 'Em casa')]


def page(path, title, desc, body, extra_head=''):
    links = ''.join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV)
    html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#fbf6f3">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; img-src 'self' data:; form-action 'none'; object-src 'none'; base-uri 'none'; frame-src 'none'">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://drajoyceradis.com{path}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://drajoyceradis.com/site/img/og-site.jpg">
<link rel="icon" href="/site/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/outubro-rosa/fonts/noto-serif-display-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site/site.css?v={V}">
<script src="/site/legado.js?v={V}"></script>
<script defer src="/site/site.js?v={V}"></script>
<script defer src="/_vercel/insights/script.js"></script>{extra_head}
</head>
<body>
<a class="campanha" id="campanha" href="/outubro-rosa/" hidden><span class="lacinho" aria-hidden="true"></span><span><b>Outubro Rosa</b> · Peça seus exames de mama e ginecológicos</span><span class="seta" aria-hidden="true">→</span></a>
<header class="top" id="top">
 <div class="wrap top-in">
  <a class="marca" href="/" aria-label="Dra. Joyce Radis, início"><strong>Dra. Joyce Radis</strong><small>Médica · CRM-ES 21188</small></a>
  <nav class="menu" id="menu" aria-label="Principal">{links}<a class="btn btn-sm" href="/agendar/">Agendar</a></nav>
  <button class="burger" id="burger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
 </div>
</header>
<main>
{body}
</main>
<footer class="rodape">
 <div class="wrap rodape-in">
  <div class="rodape-marca"><strong>Dra. Joyce Radis de Souza de Oliveira</strong><small>Médica · CRM-ES 21188 · Espírito Santo</small></div>
  <nav aria-label="Rodapé">{links}<a href="/agendar/">Agendar</a></nav>
  <div class="rodape-contato"><a href="{WA_CONSULTA}">WhatsApp (27) 99813-4032</a><a href="mailto:contato@drajoyceradis.com">contato@drajoyceradis.com</a></div>
  <p class="nota">Conteúdo informativo, que não substitui consulta médica. Em urgência, procure o pronto-atendimento mais próximo.</p>
 </div>
</footer>
</body>
</html>
'''
    out = ROOT / path.strip('/') / 'index.html' if path != '/' else ROOT / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')


def fecho(titulo='Vamos cuidar da sua saúde por inteiro?'):
    return f'''<section class="fecho"><div class="wrap fecho-in reveal"><h2>{titulo}</h2><a class="btn btn-claro" href="/agendar/">Agendar consulta</a></div></section>'''


# Início
page('/', 'Dra. Joyce Radis · Médica · Medicina integral',
     'Dra. Joyce Radis, médica (CRM-ES 21188). Consulta particular e atendimento em casa, com um olhar inteiro sobre a sua saúde.',
     f'''<section class="hero">
 <div class="hero-foto" aria-hidden="true"><img src="/site/img/joyce-hero.webp" srcset="/site/img/joyce-hero-600.webp 600w, /site/img/joyce-hero.webp 1000w" sizes="(min-width: 900px) 50vw, 100vw" width="1000" height="1450" alt="" fetchpriority="high"></div>
 <div class="hero-txt">
  <p class="kicker anim" data-d="1">Medicina integral</p>
  <h1 class="anim" data-d="2">Joyce <em>Radis</em></h1>
  <p class="hero-frase anim" data-d="3">Um olhar inteiro sobre a sua saúde.</p>
  <p class="lead anim" data-d="4">Consulta com tempo para ouvir, examinar e explicar. No consultório ou na sua casa, com acompanhamento de perto depois.</p>
  <div class="ctas anim" data-d="5"><a class="btn" href="/agendar/">Agendar consulta</a><a class="btn btn-ghost" href="/domiciliar/">Atendimento em casa</a></div>
  <p class="cred anim" data-d="6"><span>Médica</span><span>CRM-ES 21188</span><span>Pós-graduação em Endocrinologia</span></p>
 </div>
</section>

<section class="manifesto"><div class="wrap">
 <p class="reveal">Cada sintoma conta uma parte da história. <em>Eu cuido da história inteira:</em> rotina, exames, hormônios, coração e o que você sente.</p>
</div></section>

<section class="bloco"><div class="wrap">
 <p class="kicker reveal">Atendimento</p>
 <h2 class="reveal">Como posso cuidar de você</h2>
 <div class="portas">
  <a class="porta reveal" href="/atendimentos/"><span class="num">01</span><h3>Consulta clínica</h3><p>Avaliação completa, check-up e acompanhamento de pressão, diabetes, tireoide e colesterol.</p><span class="ir">Ver atendimentos</span></a>
  <a class="porta reveal" href="/domiciliar/"><span class="num">02</span><h3>Atendimento em casa</h3><p>A consulta vai até você, com o mesmo cuidado do consultório e mais conforto para a família.</p><span class="ir">Como funciona</span></a>
  <a class="porta reveal" href="/sobre/"><span class="num">03</span><h3>Quem vai te atender</h3><p>Formação, forma de trabalhar e o que esperar da primeira consulta.</p><span class="ir">Conhecer a Dra. Joyce</span></a>
 </div>
</div></section>

<section class="bloco claro"><div class="wrap">
 <p class="kicker reveal">Como funciona</p>
 <h2 class="reveal">Do primeiro contato ao retorno</h2>
 <ol class="passos">
  <li class="reveal"><b>01</b><h3>Agende</h3><p>Escolha o melhor dia e horário pelo WhatsApp.</p></li>
  <li class="reveal"><b>02</b><h3>Consulta</h3><p>No consultório ou em casa, com tempo para tudo.</p></li>
  <li class="reveal"><b>03</b><h3>Plano claro</h3><p>Você sai sabendo o que fazer, quais exames e quando voltar.</p></li>
  <li class="reveal"><b>04</b><h3>Acompanhamento</h3><p>Retorno e contato próximo para ajustar o cuidado.</p></li>
 </ol>
</div></section>
{fecho()}''')

# Sobre
page('/sobre/', 'Sobre · Dra. Joyce Radis',
     'Conheça a Dra. Joyce Radis, médica (CRM-ES 21188), sua formação e a forma de cuidar.',
     f'''<section class="sub-hero"><div class="wrap sub-in">
 <div class="sub-txt"><p class="kicker anim" data-d="1">Sobre</p><h1 class="anim" data-d="2">Medicina com <em>tempo</em> e atenção.</h1>
 <p class="lead anim" data-d="3">Sou a Dra. Joyce Radis, médica no Espírito Santo. Atendo de forma particular, no consultório e em casa, com um olhar que vai além do sintoma.</p></div>
 <figure class="sub-foto anim" data-d="2"><img src="/site/img/joyce-retrato.webp" width="800" height="1000" alt="Dra. Joyce Radis"></figure>
</div></section>

<section class="bloco"><div class="wrap duas">
 <div><p class="kicker reveal">Forma de trabalhar</p><h2 class="reveal">O todo, não só a queixa</h2></div>
 <div class="texto reveal">
  <p>Uma consulta boa começa ouvindo. Quero entender a sua rotina, o seu histórico, os exames que você já fez e o que mais te preocupa, para então examinar e explicar com calma.</p>
  <p>Tenho interesse especial em saúde metabólica e cardiovascular: tireoide, diabetes, peso, colesterol e pressão caminham juntos, e cuidar deles juntos faz diferença.</p>
  <p>Cada consulta termina com um plano claro e com a certeza de saber a quem recorrer depois.</p>
 </div>
</div></section>

<section class="bloco claro"><div class="wrap">
 <p class="kicker reveal">Formação</p>
 <h2 class="reveal">Trajetória</h2>
 <ol class="linha">
  <li class="reveal"><b>Medicina</b><p>Médica com registro no Conselho Regional de Medicina do Espírito Santo, CRM-ES 21188.</p></li>
  <li class="reveal"><b>Pós-graduação em Endocrinologia</b><p>Em curso, com foco em tireoide, diabetes e metabolismo.</p></li>
  <li class="reveal"><b>Saúde cardiovascular</b><p>Estudo contínuo em prevenção e controle do risco cardiovascular.</p></li>
 </ol>
</div></section>

<section class="bloco"><div class="wrap">
 <p class="kicker reveal">Valores</p>
 <div class="valores">
  <div class="reveal"><h3>Escuta</h3><p>Tempo de consulta para você falar e ser ouvida.</p></div>
  <div class="reveal"><h3>Clareza</h3><p>Explicações sem pressa e por escrito quando precisar.</p></div>
  <div class="reveal"><h3>Proximidade</h3><p>Acompanhamento depois da consulta, não só no retorno.</p></div>
 </div>
</div></section>
{fecho()}''')

# Atendimentos
servicos = [
    ('Consulta clínica', 'Avaliação completa da sua saúde, com história detalhada, exame físico e orientação clara.', ['Sintomas novos ou que não melhoram', 'Segunda opinião', 'Revisão de medicamentos']),
    ('Check-up e prevenção', 'Exames certos para a sua idade e o seu histórico, sem excesso e sem falta.', ['Rastreamentos indicados por idade', 'Vacinas e prevenção', 'Leitura explicada dos resultados']),
    ('Saúde metabólica', 'Acompanhamento de condições que mexem com energia, peso e disposição.', ['Diabetes e pré-diabetes', 'Tireoide', 'Colesterol e triglicerídeos', 'Controle de peso']),
    ('Coração e pressão', 'Cuidado com o risco cardiovascular antes que ele vire problema.', ['Hipertensão', 'Avaliação de risco cardiovascular', 'Mudanças de rotina com acompanhamento']),
    ('Saúde da mulher', 'Prevenção com atenção às fases da vida.', ['Pedidos de mamografia, ultrassom e preventivo', 'Climatério e menopausa', 'Orientação sobre exames de rotina']),
]
cards = ''.join(
    f'<article class="serv reveal"><span class="num">{i:02d}</span><h3>{t}</h3><p>{d}</p><ul>{"".join(f"<li>{x}</li>" for x in itens)}</ul></article>'
    for i, (t, d, itens) in enumerate(servicos, 1))
page('/atendimentos/', 'Atendimentos · Dra. Joyce Radis',
     'Consulta clínica, check-up, saúde metabólica, coração e pressão e saúde da mulher, com a Dra. Joyce Radis.',
     f'''<section class="sub-hero simples"><div class="wrap">
 <p class="kicker anim" data-d="1">Atendimentos</p><h1 class="anim" data-d="2">Cuidado <em>completo</em>, em cada fase.</h1>
 <p class="lead anim" data-d="3">Atendimento particular, no consultório ou em casa. Veja como posso ajudar.</p>
</div></section>
<section class="bloco"><div class="wrap"><div class="servs">{cards}</div></div></section>
{fecho('Não sabe por onde começar? A primeira consulta organiza tudo.')}''')

# Em casa
page('/domiciliar/', 'Atendimento em casa · Dra. Joyce Radis',
     'Consulta médica em casa com a Dra. Joyce Radis: conforto para quem tem dificuldade de se deslocar, idosos e pós-operatório.',
     f'''<section class="sub-hero vinho"><div class="wrap">
 <p class="kicker anim" data-d="1">Atendimento em casa</p><h1 class="anim" data-d="2">A consulta vai <em>até você</em>.</h1>
 <p class="lead anim" data-d="3">O mesmo cuidado do consultório, no conforto da sua casa, com tempo para conversar também com a família.</p>
 <div class="ctas anim" data-d="4"><a class="btn btn-claro" href="{WA_CASA}">Consultar disponibilidade</a></div>
</div></section>

<section class="bloco"><div class="wrap duas">
 <div><p class="kicker reveal">Para quem</p><h2 class="reveal">Quando faz sentido</h2></div>
 <ul class="checks reveal">
  <li>Pessoas idosas ou com dificuldade de locomoção</li>
  <li>Recuperação de cirurgia ou internação</li>
  <li>Doenças crônicas que pedem acompanhamento frequente</li>
  <li>Quem prefere privacidade e conforto</li>
 </ul>
</div></section>

<section class="bloco claro"><div class="wrap">
 <p class="kicker reveal">O que inclui</p>
 <h2 class="reveal">Uma consulta completa, em casa</h2>
 <div class="valores">
  <div class="reveal"><h3>Avaliação</h3><p>História, exame físico e revisão dos remédios em uso.</p></div>
  <div class="reveal"><h3>Plano</h3><p>Receitas, pedidos de exames e orientação por escrito.</p></div>
  <div class="reveal"><h3>Família</h3><p>Conversa com familiares e cuidadores sobre os próximos passos.</p></div>
 </div>
</div></section>

<section class="bloco"><div class="wrap">
 <p class="kicker reveal">Como funciona</p>
 <ol class="passos">
  <li class="reveal"><b>01</b><h3>Contato</h3><p>Conte o caso e o bairro pelo WhatsApp.</p></li>
  <li class="reveal"><b>02</b><h3>Agendamento</h3><p>Combinamos dia, horário e o que deixar separado.</p></li>
  <li class="reveal"><b>03</b><h3>Visita</h3><p>Consulta sem pressa, no seu ambiente.</p></li>
  <li class="reveal"><b>04</b><h3>Retorno</h3><p>Acompanhamento próximo depois da visita.</p></li>
 </ol>
</div></section>
{fecho('Quer saber se atendo no seu bairro?')}''')

# Agendar
faq = [
    ('Como agendo?', 'Pelo WhatsApp. Responda com o melhor dia e período e se prefere consultório ou em casa.'),
    ('Atende plano de saúde?', 'O atendimento é particular. Se o seu plano reembolsa consultas, pergunte no agendamento sobre a documentação.'),
    ('Atende em casa no meu bairro?', 'Informe o bairro no WhatsApp para confirmar a disponibilidade.'),
    ('O que levar na consulta?', 'Exames recentes, a lista de remédios em uso e as dúvidas que você quiser tirar.'),
]
faqs = ''.join(f'<details class="reveal"><summary>{q}</summary><p>{a}</p></details>' for q, a in faq)
page('/agendar/', 'Agendar consulta · Dra. Joyce Radis',
     'Agende sua consulta com a Dra. Joyce Radis pelo WhatsApp, no consultório ou em casa.',
     f'''<section class="sub-hero simples"><div class="wrap">
 <p class="kicker anim" data-d="1">Agendar</p><h1 class="anim" data-d="2">Vamos <em>marcar</em> sua consulta.</h1>
 <p class="lead anim" data-d="3">Escolha como prefere ser atendida e fale direto comigo.</p>
</div></section>
<section class="bloco"><div class="wrap">
 <div class="opcoes">
  <a class="opcao reveal" data-agendar href="{WA_CONSULTA}"><span class="num">01</span><h3>Consulta no consultório</h3><p>Escolha o melhor dia e horário.</p><span class="ir">Agendar pelo WhatsApp</span></a>
  <a class="opcao reveal" href="{WA_CASA}"><span class="num">02</span><h3>Consulta em casa</h3><p>Conte o caso e o bairro para confirmarmos.</p><span class="ir">Consultar disponibilidade</span></a>
 </div>
 <div class="faq"><p class="kicker reveal">Dúvidas</p>{faqs}</div>
</div></section>''')

print('ok')
