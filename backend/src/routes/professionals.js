"use strict";

const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", function (_req, res) {
  const rows = db.prepare("SELECT * FROM professionals ORDER BY name").all();
  res.json(rows.map(function (row) {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      initials: row.initials,
      avatar: row.avatar
    };
  }));
});

module.exports = router;
