-- Luma Studio — Schema do banco de dados
-- Codificação: UTF-8 (SQLite armazena texto em UTF-8 por padrão)

PRAGMA foreign_keys = ON;
PRAGMA encoding = 'UTF-8';

CREATE TABLE IF NOT EXISTS professionals (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  initials    TEXT NOT NULL,
  avatar      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL,
  avatar        TEXT NOT NULL DEFAULT 'avatar-bia',
  cpf           TEXT,
  birth         TEXT,
  gender        TEXT,
  phone         TEXT,
  whatsapp      TEXT,
  cep           TEXT,
  street        TEXT,
  number        TEXT,
  neighborhood  TEXT,
  city          TEXT,
  state         TEXT,
  notes         TEXT,
  preferences   TEXT,
  allergies     TEXT,
  products      TEXT,
  lgpd          INTEGER NOT NULL DEFAULT 0,
  total_spent   REAL NOT NULL DEFAULT 0,
  visits        INTEGER NOT NULL DEFAULT 0,
  last_visit    TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  duration    INTEGER NOT NULL,
  price       REAL NOT NULL,
  promo_price REAL NOT NULL DEFAULT 0,
  commission  REAL NOT NULL DEFAULT 0,
  description TEXT,
  materials   TEXT
);

-- Agendamentos e bloqueios (status = 'blocked' para intervalos/almoço)
CREATE TABLE IF NOT EXISTS appointments (
  id              TEXT PRIMARY KEY,
  client_id       TEXT,
  client_name     TEXT,
  service_id      TEXT,
  service_name    TEXT,
  professional_id TEXT NOT NULL,
  date            TEXT NOT NULL,
  time            TEXT NOT NULL,
  duration        INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled',
  title           TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
