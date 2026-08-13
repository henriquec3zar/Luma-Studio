"use strict";

const express = require("express");
const db = require("../db");
const crypto = require("crypto");

const router = express.Router();

function rowToClient(row) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    avatar: row.avatar,
    cpf: row.cpf || "",
    birth: row.birth || "",
    gender: row.gender || "",
    phone: row.phone || "",
    whatsapp: row.whatsapp || "",
    cep: row.cep || "",
    street: row.street || "",
    number: row.number || "",
    neighborhood: row.neighborhood || "",
    city: row.city || "",
    state: row.state || "",
    notes: row.notes || "",
    preferences: row.preferences || "",
    allergies: row.allergies || "",
    products: row.products || "",
    lgpd: !!row.lgpd,
    totalSpent: row.total_spent,
    visits: row.visits,
    lastVisit: row.last_visit || ""
  };
}

function initials(name) {
  return String(name || "?").split(/\s+/).slice(0, 2).map(function (part) {
    return part.charAt(0);
  }).join("").toUpperCase();
}

router.get("/", function (req, res) {
  const query = req.query.q ? String(req.query.q).trim().toLowerCase() : "";
  let rows = db.prepare("SELECT * FROM clients ORDER BY name").all();
  if (query) {
    rows = rows.filter(function (row) {
      return (row.name && row.name.toLowerCase().includes(query)) ||
        (row.phone && row.phone.toLowerCase().includes(query)) ||
        (row.whatsapp && row.whatsapp.toLowerCase().includes(query));
    });
  }
  res.json(rows.map(rowToClient));
});

router.get("/:id", function (req, res) {
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Cliente não encontrada." });
  res.json(rowToClient(row));
});

router.post("/", function (req, res) {
  const body = req.body;
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: "Informe o nome da cliente." });
  }

  const id = "c" + Date.now().toString(36);
  const avatars = ["ana", "julia", "marina", "carol", "nati", "bia"];
  const avatar = body.avatar || ("avatar-" + avatars[crypto.randomInt(avatars.length)]);

  db.prepare(`
    INSERT INTO clients (
      id, name, initials, avatar, cpf, birth, gender, phone, whatsapp,
      cep, street, number, neighborhood, city, state, notes, preferences,
      allergies, products, lgpd, total_spent, visits, last_visit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(body.name).trim(),
    initials(body.name),
    avatar,
    body.cpf || "",
    body.birth || "",
    body.gender || "",
    body.phone || "",
    body.whatsapp || "",
    body.cep || "",
    body.street || "",
    body.number || "",
    body.neighborhood || "",
    body.city || "",
    body.state || "",
    body.notes || "",
    body.preferences || "",
    body.allergies || "",
    body.products || "",
    body.lgpd ? 1 : 0,
    0,
    0,
    ""
  );

  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  res.status(201).json(rowToClient(row));
});

router.put("/:id", function (req, res) {
  const existing = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Cliente não encontrada." });

  const body = req.body;
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: "Informe o nome da cliente." });
  }

  db.prepare(`
    UPDATE clients SET
      name = ?, initials = ?, avatar = ?, cpf = ?, birth = ?, gender = ?,
      phone = ?, whatsapp = ?, cep = ?, street = ?, number = ?,
      neighborhood = ?, city = ?, state = ?, notes = ?, preferences = ?,
      allergies = ?, products = ?, lgpd = ?
    WHERE id = ?
  `).run(
    String(body.name).trim(),
    initials(body.name),
    body.avatar || existing.avatar,
    body.cpf || "",
    body.birth || "",
    body.gender || "",
    body.phone || "",
    body.whatsapp || "",
    body.cep || "",
    body.street || "",
    body.number || "",
    body.neighborhood || "",
    body.city || "",
    body.state || "",
    body.notes || "",
    body.preferences || "",
    body.allergies || "",
    body.products || "",
    body.lgpd ? 1 : 0,
    req.params.id
  );

  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  res.json(rowToClient(row));
});

router.delete("/:id", function (req, res) {
  const existing = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Cliente não encontrada." });
  db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
  res.json({ ok: true, id: req.params.id });
});

module.exports = router;
