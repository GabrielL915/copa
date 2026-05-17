# Álbum Mundial 2026

Aplicativo web para acompanhar o álbum de figurinhas do Mundial 2026: marque as
figurinhas que você já tem, registre repetidas e veja o que falta para trocar.
Tema **Anthropic dark** (cinzas quentes, acento terracota), mobile-first.

Construído com [Astro](https://astro.build) + React, gerenciado com **pnpm**.

## Stack

- **Astro 5** — framework / build
- **React 18** — componente do álbum (`client:only`)
- **TypeScript** (strict)
- Persistência local via `localStorage` (chave `album-v1-anthropic`)

## Estrutura

```
src/
  components/AlbumApp.tsx   # app React (portado de variation-a.jsx)
  data/album.ts             # grupos, times e contagens (portado de data.js)
  layouts/Layout.astro      # HTML base
  pages/index.astro         # página única, monta o app
  styles/global.css         # shell responsivo
public/favicon.svg
astro.config.ts
```

Os arquivos originais (`index.html`, `data.js`, `*.jsx`, HTML exportado) foram
movidos para `legacy/` apenas como referência — não fazem parte do build.

## Comandos

```sh
pnpm install      # instalar dependências
pnpm dev          # servidor de desenvolvimento (http://localhost:4321)
pnpm build        # build de produção em dist/
pnpm preview      # pré-visualizar o build
```

## Uso

- **Toque** numa figurinha para marcar como obtida.
- **Segure** (long-press) para registrar uma repetida (até 9).
- Aba **Trocas**: lista o que falta e o que está repetido; botão para zerar o álbum.
- Busca por país, sigla ou grupo (ex.: `BRA`, `Brasil`, `grupo c`).
