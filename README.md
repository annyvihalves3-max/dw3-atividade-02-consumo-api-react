# Roteiros Brasil — DW3

Catálogo de destinos turísticos usando React, Next.js e a API pública MediaWiki (Wikipédia em português).

## Executar

```bash
git clone https://github.com/annyvihalves3-max/dw3-atividade-02-consumo-api-react.git
cd dw3-atividade-02-consumo-api-react
npm install
npm run dev
```

Abra http://localhost:3000.

## Como funciona

- A página inicial consulta a API MediaWiki (`action=query&generator=search`) para listar artigos relacionados a atrações de cidades brasileiras.
- Os cards são gerados a partir dos resultados da API, não de uma lista fixa de atrações.
- Ao clicar em um card, a rota `/destino/[id]` consulta a API pelo `pageid` do artigo.
- Filtros de cidade, categoria e busca por texto. As categorias são classificações heurísticas locais e podem não ser perfeitas.
- A Wikipédia não é um catálogo turístico: alguns resultados podem ser pouco relevantes ou não ter imagem.

Atribua textos e imagens de acordo com as licenças indicadas nas páginas de origem.
