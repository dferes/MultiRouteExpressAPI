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

    } catch(e) {
       
    }
})


// router.put('/:id', async (req, res, next) => {
//     try {

//     } catch(e) {
        
//     }
// })


// router.delete('/:id', async (req, res, next) => {
//     try {

//     } catch(e) {
        
//     }
// })

module.exports = router;