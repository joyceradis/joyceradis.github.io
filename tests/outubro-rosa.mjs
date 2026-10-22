// Teste de fumaça da ficha do Outubro Rosa, em tela de celular.
// Uso: sirva a raiz do repositório em http://localhost:8080 e rode `node tests/outubro-rosa.mjs`.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:8080/outubro-rosa/';
const fail = msg => { console.error('FALHOU:', msg); process.exitCode = 1; };

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, headless: false, args: ['--no-sandbox', '--headless=new'] } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true, locale: 'pt-BR' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
// O contador de visitas da Vercel só existe no ar; localmente ele dá 404 e é ignorado.
page.on('console', m => { if (m.type() === 'error' && !(m.location().url || '').includes('/_vercel/')) errors.push(m.text()); });
page.on('requestfailed', r => { if (!/viacep|\/_vercel\//.test(r.url())) errors.push('falhou ao carregar ' + r.url()); });

await page.goto(BASE);
await page.waitForLoadState('networkidle');
if (!(await page.isVisible('h1'))) fail('título não aparece');
if (await page.evaluate(() => document.documentElement.scrollWidth) > 390) fail('rolagem horizontal no celular');
const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].every(f => f.status !== 'error'); });
if (!fontsOk) fail('fonte não carregou');

// Avança sem preencher nada e gera a ficha
for (let i = 0; i < 6; i++) { await page.click('#next'); await page.waitForTimeout(250); }
await page.waitForSelector('#result', { state: 'visible', timeout: 5000 }).catch(() => fail('tela final não apareceu sem preencher'));

// Fluxo com nome: o PDF baixa e a tela final mostra o nome
await page.reload();
await page.fill('#nome', 'Maria Teste da Silva');
await page.fill('#nascimento', '10031980');
for (let i = 0; i < 6; i++) { await page.click('#next'); await page.waitForTimeout(250); }
await page.waitForSelector('#result', { state: 'visible', timeout: 5000 }).catch(() => fail('tela final não apareceu'));
if (!(await page.textContent('#rHello') || '').includes('Maria')) fail('nome não aparece na tela final');
const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
const pdf = await download.createReadStream();
let size = 0; for await (const chunk of pdf) size += chunk.length;
if (size < 2000) fail(`PDF pequeno demais (${size} bytes)`);
if (!(await page.isVisible('.pix-qr'))) fail('QR Code do Pix não aparece');

// Página inicial do site
const home = new URL('../index.html', BASE).href;
await page.goto(home);
await page.waitForLoadState('networkidle');
if (!(await page.isVisible('h1'))) fail('título da página inicial não aparece');
if (!(await page.isVisible('.hero-foto img'))) fail('foto da página inicial não aparece');
for (const p of ['sobre/', 'atendimentos/', 'domiciliar/', 'agendar/']) {
  const r = await page.request.get(new URL('../' + p, BASE).href);
  if (r.status() !== 200) fail(`página ${p} não abre (${r.status()})`);
}
await page.goto(home);
if (!(await page.getAttribute('.hero .btn', 'href'))) fail('botão Agendar sem link');
if (await page.evaluate(() => document.documentElement.scrollWidth) > 390) fail('rolagem horizontal na página inicial');

if (errors.length) fail('erros na página:\n  ' + errors.join('\n  '));
await browser.close();
if (!process.exitCode) console.log('OK: página, fluxo, PDF e Pix funcionando');
