const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT code, name FROM companies');
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
})


router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(
            `SELECT com.code, com.name, com.description, inv.id  
            FROM companies AS com
            INNER JOIN invoices AS inv
            ON (inv.comp_code = com.code)
            WHERE com.code = $1`, 
            [code]
        );

        if ( results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }

        return res.json({ 
            company: { 
                code:   results.rows[0].code,
                name:   results.rows[0].name,
                description: results.rows[0].description,
                invoices: 
                    results.rows.map(res => res.id)
            }
        });
    } catch(e) {
        return next(e);
    }
})


router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        if (!code || ! name || !description) {
            throw new ExpressError('Missing JSON data, must provide a company code, name, and description', 400);
        }
        const results = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3) 
             RETURNING code, name, description`, 
             [code, name, description]
        );
        return res.status(201).json({ company: results.rows[0] });
    } catch(e) {
        return next(e);
    }
})

router.put('/:code', async (req, res, next) =>  {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(
            `UPDATE companies 
             SET name=$2, description=$3 
             WHERE code=$1 
             RETURNING code, name, description`, 
             [code, name, description]
        );
        if(results.rows.length === 0) {
            throw new ExpressError(`Cannot find a company with a code of ${code}`, 404);
        }
        return res.status(200).json({ company: results.rows[0] });
    } catch(e) {
        return next(e);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const foundRow = await db.query('SELECT * FROM companies WHERE code=$1', [req.params.code]);

        if (foundRow.rows.length === 0) {
            throw new ExpressError(`Cannot find a company with a code of ${req.params.code}`, 404);
        }
        await db.query('DELETE FROM companies WHERE code=$1', [req.params.code]);
        return res.json({ message: 'DELETED' });
    } catch(e) {
        return next(e);
    }
})

module.exports = router;