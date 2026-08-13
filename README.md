# Luma Studio — Agenda Inteligente

Aplicação web para gestão de salão, com dashboard, agenda por dia/semana/mês,
cadastro de clientes, cadastro de serviços e API REST em Node.js.

## Estrutura

- `frontend/`: interface HTML, CSS e JavaScript.
- `backend/`: API Express e scripts de banco.
- `database/`: schema e seed demonstrativo em SQLite.

## Como rodar

```bash
cd backend
npm install
npm run init-db
npm run dev
```

Depois acesse `http://localhost:3001`.

## Observações para GitHub

O repositório foi preparado para não versionar dependências, bancos locais,
arquivos `.env` ou material privado de trabalho. O seed público usa dados
genéricos de demonstração.
