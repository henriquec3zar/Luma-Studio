# Luma Studio — Frontend

Interface web estática para o projeto Luma Studio.

## O que está aqui

- `index.html` — página principal do painel.
- `styles.css` — estilos do layout e componentes.
- `js/api.js` — cliente HTTP que consome a API REST.
- `js/app.js` — lógica da interface, renderização e interações.

## Observações importantes

- Este diretório contém apenas frontend estático.
- Não há segredos, chaves privadas ou variáveis sensíveis no código frontend.
- O frontend usa `window.APP_AGENDA_API_BASE` ou `"/api"` como base da API.

## Como usar

1. Abra `index.html` em um navegador.
2. Se quiser conectar a uma API backend diferente, defina `window.APP_AGENDA_API_BASE` antes de carregar `js/api.js`.

Exemplo no HTML:

```html
<script>
  window.APP_AGENDA_API_BASE = "https://seu-backend.example.com/api";
</script>
<script src="./js/api.js"></script>
```
