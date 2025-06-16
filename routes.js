const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/faqs', (req, res) => {
  db.query('SELECT * FROM faqs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results); // isso retorna perguntas, respostas e intenções
  });
});

module.exports = router;
