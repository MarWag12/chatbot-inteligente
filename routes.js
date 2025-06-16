const express = require('express');
const router = express.Router();
const db = require('./db');

// rota para faqs
router.get('/faqs', (req, res) => {
  db.query('SELECT * FROM faqs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results); // isso retorna perguntas, respostas e intenções
  });
});

// rota para o agendamento
router.post('/agendar', (req, res) => {
  const { nome, email, data, motivo } = req.body;

  const sqlVerifica = 'SELECT * FROM agendamentos WHERE data = ?';
  db.query(sqlVerifica, [data], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro ao verificar disponibilidade.' });

    if (result.length > 0) {
      return res.status(409).json({ msg: 'Horário indisponível.' });
    }

    const sql = 'INSERT INTO agendamentos (nome, email, data, motivo) VALUES (?, ?, ?, ?)';
    db.query(sql, [nome, email, data, motivo], (err, result) => {
      if (err) return res.status(500).json({ erro: 'Erro ao agendar.' });
      res.status(201).json({ msg: 'Agendamento realizado com sucesso!' });
    });
  });
});

module.exports = router;
