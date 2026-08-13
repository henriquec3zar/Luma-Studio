"use strict";

const express = require("express");
const db = require("../db");
const {
  rowToAppointment,
  validateConflict,
  nearestAvailableSlots,
  hasConflict,
  BUSINESS_END,
  toMinutes
} = require("../services/conflictService");

const router = express.Router();

function buildWhere(filters) {
  const clauses = [];
  const params = [];
  if (filters.date) {
    clauses.push("date = ?");
    params.push(filters.date);
  }
  if (filters.from) {
    clauses.push("date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("date <= ?");
    params.push(filters.to);
  }
  if (filters.professional && filters.professional !== "all") {
    clauses.push("professional_id = ?");
    params.push(filters.professional);
  }
  if (filters.status && filters.status !== "all") {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  return { where: clauses.length ? "WHERE " + clauses.join(" AND ") : "", params };
}

router.get("/", function (req, res) {
  const { where, params } = buildWhere(req.query);
  const rows = db.prepare(`
    SELECT * FROM appointments ${where} ORDER BY date, time
  `).all(...params);
  res.json(rows.map(rowToAppointment));
});

router.get("/:id", function (req, res) {
  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Agendamento não encontrado." });
  res.json(rowToAppointment(row));
});

router.post("/check-conflict", function (req, res) {
  const candidate = req.body;
  if (!candidate.date || !candidate.time || !candidate.professionalId || !candidate.duration) {
    return res.status(400).json({ error: "Dados incompletos para verificação de conflito." });
  }
  res.json(validateConflict(candidate, candidate.id || ""));
});

router.post("/", function (req, res) {
  const body = req.body;
  const isBlock = body.status === "blocked";

  if (!body.professionalId || !body.date || !body.time || !body.duration) {
    return res.status(400).json({ error: "Profissional, data, horário e duração são obrigatórios." });
  }
  if (!isBlock && !body.client) {
    return res.status(400).json({ error: "Escolha uma cliente para continuar." });
  }

  const candidate = {
    date: body.date,
    time: body.time,
    duration: body.duration,
    professionalId: body.professionalId
  };

  if (hasConflict(candidate, "")) {
    const result = validateConflict(candidate, "");
    return res.status(409).json({
      error: "Conflito de horário.",
      conflict: result.conflict,
      suggestions: result.suggestions
    });
  }

  const id = body.id || (isBlock ? "b" : "a") + Date.now().toString(36);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO appointments (
      id, client_id, client_name, service_id, service_name,
      professional_id, date, time, duration, status, title, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.clientId || null,
    isBlock ? null : (body.client || null),
    body.serviceId || null,
    isBlock ? null : (body.service || null),
    body.professionalId,
    body.date,
    body.time,
    Number(body.duration),
    isBlock ? "blocked" : (body.status || "scheduled"),
    isBlock ? (body.title || "Intervalo") : null,
    body.notes || "",
    now,
    now
  );

  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  res.status(201).json(rowToAppointment(row));
});

router.put("/:id", function (req, res) {
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agendamento não encontrado." });

  const body = req.body;
  const isBlock = existing.status === "blocked" || body.status === "blocked";

  const candidate = {
    date: body.date || existing.date,
    time: body.time || existing.time,
    duration: body.duration != null ? body.duration : existing.duration,
    professionalId: body.professionalId || existing.professional_id
  };

  if (hasConflict(candidate, req.params.id)) {
    const result = validateConflict(candidate, req.params.id);
    return res.status(409).json({
      error: "Conflito de horário.",
      conflict: result.conflict,
      suggestions: result.suggestions
    });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE appointments SET
      client_id = ?, client_name = ?, service_id = ?, service_name = ?,
      professional_id = ?, date = ?, time = ?, duration = ?,
      status = ?, title = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.clientId !== undefined ? body.clientId : existing.client_id,
    isBlock ? null : (body.client !== undefined ? body.client : existing.client_name),
    body.serviceId !== undefined ? body.serviceId : existing.service_id,
    isBlock ? null : (body.service !== undefined ? body.service : existing.service_name),
    candidate.professionalId,
    candidate.date,
    candidate.time,
    candidate.duration,
    isBlock ? "blocked" : (body.status || existing.status),
    isBlock ? (body.title || existing.title) : null,
    body.notes !== undefined ? body.notes : existing.notes,
    now,
    req.params.id
  );

  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  res.json(rowToAppointment(row));
});

router.patch("/:id/status", function (req, res) {
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agendamento não encontrado." });

  const allowed = ["scheduled", "confirmed", "progress", "finished", "cancelled", "no-show"];
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?")
    .run(req.body.status, now, req.params.id);

  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  res.json(rowToAppointment(row));
});

router.patch("/:id/reschedule", function (req, res) {
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agendamento não encontrado." });

  const candidate = {
    date: req.body.date || existing.date,
    time: req.body.time || existing.time,
    duration: existing.duration,
    professionalId: req.body.professionalId || existing.professional_id
  };

  if (toMinutes(candidate.time) + Number(candidate.duration) > BUSINESS_END) {
    return res.status(400).json({ error: "Não há tempo suficiente antes do encerramento do salão." });
  }

  if (hasConflict(candidate, req.params.id)) {
    return res.status(409).json({ error: "Não foi possível reagendar: esse horário já está ocupado." });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE appointments SET date = ?, time = ?, professional_id = ?, updated_at = ? WHERE id = ?
  `).run(candidate.date, candidate.time, candidate.professionalId, now, req.params.id);

  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  res.json(rowToAppointment(row));
});

router.post("/:id/duplicate", function (req, res) {
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agendamento não encontrado." });
  if (existing.status === "blocked") {
    return res.status(400).json({ error: "Bloqueios não podem ser duplicados." });
  }

  const candidate = {
    date: req.body.date || existing.date,
    time: req.body.time || existing.time,
    duration: existing.duration,
    professionalId: req.body.professionalId || existing.professional_id
  };

  const suggestions = nearestAvailableSlots(candidate, "");
  const time = req.body.time || suggestions[0] || existing.time;

  // If confirm flag is set, actually create the duplicate
  if (req.body.confirm) {
    const finalCandidate = {
      date: candidate.date,
      time: time,
      duration: candidate.duration,
      professionalId: candidate.professionalId
    };

    if (hasConflict(finalCandidate, "")) {
      const result = validateConflict(finalCandidate, "");
      return res.status(409).json({
        error: "Conflito de horário.",
        conflict: result.conflict,
        suggestions: result.suggestions
      });
    }

    const newId = "a" + Date.now().toString(36);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO appointments (
        id, client_id, client_name, service_id, service_name,
        professional_id, date, time, duration, status, title, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      existing.client_id,
      existing.client_name,
      existing.service_id,
      existing.service_name,
      finalCandidate.professionalId,
      finalCandidate.date,
      finalCandidate.time,
      finalCandidate.duration,
      "scheduled",
      null,
      existing.notes || "",
      now,
      now
    );

    const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(newId);
    return res.status(201).json(rowToAppointment(row));
  }

  res.json({
    duplicateFrom: rowToAppointment(existing),
    suggestedTime: time,
    suggestions: suggestions
  });
});

router.delete("/:id", function (req, res) {
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agendamento não encontrado." });
  db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
  res.json({ ok: true, id: req.params.id });
});

module.exports = router;
