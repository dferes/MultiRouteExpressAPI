const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
              `SELECT id, comp_code 
               FROM invoices`
        );
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
})


router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) {
            throw new ExpressError('id must be an integer value', 400);
        }
        const results = await db.query(
              `SELECT inv.id, inv.amt, inv.paid, inv.add_date, inv.paid_date, inv.comp_code, com.name, com.description 
               FROM invoices AS inv
                 INNER JOIN companies AS com 
                   ON (inv.comp_code = com.code)
               WHERE id = $1`, [id]
        );
        
        if ( results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        const invoice = {
            id: results.rows[0].id,
            amt: results.rows[0].amt,
            paid: results.rows[0].paid,
            add_date: results.rows[0].add_date,
            paid_date: results.rows[0].paid_date, 

            company: {
              code: results.rows[0].comp_code,
              name: results.rows[0].name,
              description: results.rows[0].description,
            }
          };
        return res.json({ invoice: invoice });
    } catch(e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        if (!comp_code || !amt) {
            throw new ExpressError('Missing JSON data, must provide an invoice comp_code and amount', 400);
        }
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2) 
             RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
             [comp_code, amt]);
        
        return res.status(201).json({ invoice: results.rows[0] });
    } catch(e) {
       return next(e)
    }
})


router.put('/:id', async (req, res, next) => {
    try {
        const {amt} = req.body;
        if (!amt){ 
            throw new ExpressError('Missing JSON data, must provide an invoice amount', 400);
        }
        if (isNaN(req.params.id)) {
            throw new ExpressError('id must be an integer value', 400);
        }
        
        const result = await db.query(
            `UPDATE invoices 
             SET amt=$2 
             WHERE id=$1 
             RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
             [req.params.id, amt]);

        if(result.rows.length === 0) {
            throw new ExpressError(`No invoice with an id ${req.params.id} exists`, 404);
        }
        return res.status(200).json({ invoice: result.rows[0] });
    } catch(e) {
        return next(e);
    }
})


router.delete('/:id', async (req, res, next) => {
    try {
        if (isNaN(req.params.id)) {
            throw new ExpressError('id must be an integer value', 400);
        }
        const foundRow = await db.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);

        if (foundRow.rows.length === 0) {
            throw new ExpressError(`Cannot find an invoice with an id of ${req.params.id}`, 404);
        }
        await db.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
        return res.json({ message: 'DELETED' });
    } catch(e) {
        return next(e);
    }
})

module.exports = router;