const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT code, name FROM invoices');
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
})

module.exports = router;