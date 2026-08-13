"use strict";

const db = require("../db");

const BUSINESS_START = 8 * 60;
const BUSINESS_END = 20 * 60;

function toMinutes(time) {
  const parts = String(time).split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function toTime(minutes) {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, minutes));
  return String(Math.floor(bounded / 60)).padStart(2, "0") + ":" + String(bounded % 60).padStart(2, "0");
}

function isBlocking(status) {
  return status !== "cancelled" && status !== "no-show";
}

function rowToAppointment(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id || null,
    client: row.client_name || null,
    serviceId: row.service_id || null,
    service: row.service_name || null,
    professionalId: row.professional_id,
    date: row.date,
    time: row.time,
    duration: row.duration,
    status: row.status,
    title: row.title || null,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getAppointmentsForConflict(date, professionalId, excludeId) {
  const rows = db.prepare(`
    SELECT id, date, time, duration, status
    FROM appointments
    WHERE date = ? AND professional_id = ? AND id != ?
  `).all(date, professionalId, excludeId || "");
  return rows.filter(function (row) { return isBlocking(row.status); });
}

function hasConflict(candidate, excludeId) {
  const start = toMinutes(candidate.time);
  const end = start + Number(candidate.duration);
  const items = getAppointmentsForConflict(candidate.date, candidate.professionalId, excludeId);
  return items.some(function (item) {
    const itemStart = toMinutes(item.time);
    const itemEnd = itemStart + Number(item.duration);
    return start < itemEnd && end > itemStart;
  });
}

function findConflictingItem(candidate, excludeId) {
  const start = toMinutes(candidate.time);
  const end = start + Number(candidate.duration);
  const items = getAppointmentsForConflict(candidate.date, candidate.professionalId, excludeId);
  return items.find(function (item) {
    const itemStart = toMinutes(item.time);
    const itemEnd = itemStart + Number(item.duration);
    return start < itemEnd && end > itemStart;
  }) || null;
}

function nearestAvailableSlots(candidate, excludeId) {
  const base = toMinutes(candidate.time);
  const options = [];
  const offsets = [30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180, -180];
  offsets.forEach(function (offset) {
    if (options.length >= 3) return;
    const minutes = base + offset;
    if (minutes < BUSINESS_START || minutes + Number(candidate.duration) > BUSINESS_END) return;
    const proposed = {
      date: candidate.date,
      professionalId: candidate.professionalId,
      time: toTime(minutes),
      duration: candidate.duration
    };
    if (!hasConflict(proposed, excludeId) && !options.includes(proposed.time)) {
      options.push(proposed.time);
    }
  });
  return options.sort(function (a, b) {
    return Math.abs(toMinutes(a) - base) - Math.abs(toMinutes(b) - base);
  });
}

function validateConflict(candidate, excludeId) {
  const conflict = findConflictingItem(candidate, excludeId);
  if (!conflict) {
    return { hasConflict: false, conflict: null, suggestions: [] };
  }
  const conflictRow = db.prepare("SELECT * FROM appointments WHERE id = ?").get(conflict.id);
  const suggestions = nearestAvailableSlots(candidate, excludeId);
  return {
    hasConflict: true,
    conflict: rowToAppointment(conflictRow),
    suggestions: suggestions
  };
}

module.exports = {
  BUSINESS_START,
  BUSINESS_END,
  toMinutes,
  toTime,
  isBlocking,
  rowToAppointment,
  hasConflict,
  findConflictingItem,
  nearestAvailableSlots,
  validateConflict
};
