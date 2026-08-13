"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const rootDir = path.resolve(__dirname, "../..");
const dbPath = path.join(rootDir, "database", "app_agenda.db");
const schemaPath = path.join(rootDir, "database", "schema.sql");
const seedPath = path.join(rootDir, "database", "seed.sql");

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("encoding = 'UTF-8'");

const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

if (fs.existsSync(seedPath)) {
  const seed = fs.readFileSync(seedPath, "utf8");
  db.exec(seed);
}

db.close();
console.log("Banco de dados inicializado em:", dbPath);
