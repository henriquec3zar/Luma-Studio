"use strict";

const express = require("express");
const db = require("../db");

const router = express.Router();

function rowToService(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    duration: row.duration,
    price: row.price,
    promoPrice: row.promo_price,
    commission: row.commission,
    description: row.description || "",
    materials: row.materials || ""
  };
}

router.get("/", function (req, res) {
  const query = req.query.q ? String(req.query.q).trim().toLowerCase() : "";
  let rows = db.prepare("SELECT * FROM services ORDER BY name").all();
  if (query) {
    rows = rows.filter(function (row) {
      return (row.name && row.name.toLowerCase().includes(query)) ||
        (row.category && row.category.toLowerCase().includes(query));
    });
  }
  res.json(rows.map(rowToService));
});

router.get("/:id", function (req, res) {
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Serviço não encontrado." });
  res.json(rowToService(row));
});

router.post("/", function (req, res) {
  const body = req.body;
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: "Informe o nome do serviço." });
  }
  const price = parseFloat(body.price);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "Informe um valor válido." });
  }

  const id = "s" + Date.now().toString(36);
  db.prepare(`
    INSERT INTO services (id, name, category, duration, price, promo_price, commission, description, materials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(body.name).trim(),
    body.category || "Outros",
    Number(body.duration) || 60,
    price,
    parseFloat(body.promoPrice) || 0,
    parseFloat(body.commission) || 0,
    body.description || "",
    body.materials || ""
  );

  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
  res.status(201).json(rowToService(row));
});

router.put("/:id", function (req, res) {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Serviço não encontrado." });

  const body = req.body;
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: "Informe o nome do serviço." });
  }
  const price = parseFloat(body.price);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "Informe um valor válido." });
  }

  db.prepare(`
    UPDATE services SET
      name = ?, category = ?, duration = ?, price = ?, promo_price = ?,
      commission = ?, description = ?, materials = ?
    WHERE id = ?
  `).run(
    String(body.name).trim(),
    body.category || existing.category,
    Number(body.duration) || existing.duration,
    price,
    parseFloat(body.promoPrice) || 0,
    parseFloat(body.commission) || 0,
    body.description || "",
    body.materials || "",
    req.params.id
  );

  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  res.json(rowToService(row));
});

router.delete("/:id", function (req, res) {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Serviço não encontrado." });
  db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
  res.json({ ok: true, id: req.params.id });
});

module.exports = router;
