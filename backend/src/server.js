"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");

const appointmentsRouter = require("./routes/appointments");
const clientsRouter = require("./routes/clients");
const servicesRouter = require("./routes/services");
const professionalsRouter = require("./routes/professionals");

const app = express();
const PORT = process.env.PORT || 3001;
const frontendDir = path.resolve(__dirname, "../../frontend");

app.use(cors());
app.use(express.json({ limit: "1mb", type: "application/json" }));

// UTF-8 explícito apenas nas rotas da API (não força JSON em assets estáticos)
app.use("/api", function (_req, res, next) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.get("/api/health", function (_req, res) {
  res.json({
    status: "ok",
    encoding: "UTF-8",
    message: "API Luma Studio — suporte a pontuação e caracteres especiais."
  });
});

app.use("/api/appointments", appointmentsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/professionals", professionalsRouter);

app.use(
  express.static(frontendDir, {
    setHeaders: function (res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (filePath.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
    }
  })
);

// SPA fallback: qualquer rota não-API devolve o index do frontend
app.get("*", function (req, res, next) {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDir, "index.html"), function (err) {
    if (err) next(err);
  });
});

app.use(function (_req, res) {
  res.status(404).json({ error: "Recurso não encontrado." });
});

app.use(function (err, _req, res, _next) {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, function () {
  console.log("Luma Studio API em http://localhost:" + PORT);
  console.log("Frontend em http://localhost:" + PORT + "/");
  console.log("Encoding: UTF-8 (pontuação e caracteres especiais suportados)");
});
