# Regras deste repositório

A pasta `outubro-rosa/` está no ar em https://drajoyceradis.vercel.app e é compartilhada com pacientes. A Vercel publica automaticamente o que entra na `main`.

- **Versão aprovada:** a branch `versao-aprovada-outubro-rosa-v1` guarda a versão que a Joyce aprovou em 22/10/2026. Não altere essa branch.
- **Nenhuma mudança direto na `main`.** Trabalhe em outra branch e abra um PR. O teste "Outubro Rosa" precisa passar.
- **Aprovação antes de publicar:** mande à Joyce o link de preview que a Vercel comenta no PR. Só faça o merge depois que ela aprovar explicitamente.
- **Se algo quebrar no ar:** na Vercel, abra Deployments e use Instant Rollback na última publicação boa, ou restaure `outubro-rosa/` a partir da branch da versão aprovada.
- O repositório é público. Nunca grave dados de pacientes aqui.
