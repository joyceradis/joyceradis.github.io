/* Quem abrir pelo endereço antigo do GitHub Pages vai para o link oficial. */
if (/\.github\.io$/.test(location.hostname)) {
  location.replace('https://drajoyceradis.vercel.app/outubro-rosa/' + location.search + location.hash);
}
