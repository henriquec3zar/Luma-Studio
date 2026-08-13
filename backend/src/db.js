"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.resolve(__dirname, "../../database/app_agenda.db");
const schemaPath = path.resolve(__dirname, "../../database/schema.sql");

// Cria o banco a partir do schema se ainda não existir (UTF-8 nativo no SQLite)
if (!fs.existsSync(dbPath)) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const bootstrap = new Database(dbPath);
  bootstrap.pragma("foreign_keys = ON");
  bootstrap.pragma("encoding = 'UTF-8'");
  if (fs.existsSync(schemaPath)) {
    bootstrap.exec(fs.readFileSync(schemaPath, "utf8"));
  }
  bootstrap.close();
  console.warn("[db] Banco criado vazio em", dbPath, "— execute: npm run init-db");
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("encoding = 'UTF-8'");

module.exports = db;
