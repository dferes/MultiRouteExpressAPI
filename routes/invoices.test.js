process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;

beforeEach(async () => {
  await db.query(
    `INSERT INTO companies (code, name, description) 
     VALUES ('google', 'Google', 'Overlords') 
     RETURNING code, name, description`
  );

  await db.query(
    `INSERT INTO companies (code, name, description) 
     VALUES ('apple', 'Apple', '$2000 laptops') 
     RETURNING code, name, description`
  );

  await db.query(
    `INSERT INTO invoices (comp_code, amt) 
     VALUES ('google', 650) 
     RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt) 
     VALUES ('apple', 1700) 
     RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );

  testInvoice = result.rows[0];
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query('DELETE FROM invoices');
})

afterAll(async () => {
  await db.end()
})


describe("GET /invoices", () => {
    test("Get a list of all invoices when no id variable is passed as a query parameter", async () => {
      const res = await request(app).get('/invoices')
      expect(res.statusCode).toEqual(200);
      expect(res.body.invoices.length).toEqual(2);
      expect(res.body.invoices[0]).toHaveProperty('id');
      expect(res.body.invoices[0].comp_code).toEqual('google');
    })
  })

  describe("GET /invoices/:id", () => {
    test("Retrievs a single invoice when a valid invoice parameter is passed in", async () => {
      const res = await request(app).get(`/invoices/${testInvoice.id}`)
      expect(res.statusCode).toBe(200);
      expect(res.body.invoice.id).toEqual(testInvoice.id);
      expect(res.body.invoice.amt).toEqual(testInvoice.amt);
      expect(res.body.invoice.paid).toEqual(false);
      expect(res.body.invoice.add_date).toBeDefined();
      expect(res.body.invoice.paid_date).toEqual(null);
      expect(res.body.invoice.company.code).toEqual(testInvoice.comp_code);
      expect(res.body.invoice.company.name).toEqual('Apple');

    })
    test("Responds with 400 when a non integer value is passed as invoice id parameter", async () => {
      const res = await request(app).get(`/invoices/amazonnn`)
      expect(res.statusCode).toEqual(400);
    })
    test("Responds with 404 when an invalid integer value is passed as invoice id parameter", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toEqual(404);
      })
  })
  
  describe("POST /invoices", () => {
    test("Creates a single invoice when comp_code and amout JSON data is correctly passed in", async () => {
      const res = await request(app).post('/invoices').send({ 
        comp_code: 'google', 
        amt: '750', 
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.invoice.id).toBeDefined();
      expect(res.body.invoice.comp_code).toEqual('google');
      expect(res.body.invoice.amt).toEqual(750);
      expect(res.body.invoice.paid).toEqual(false);
      expect(res.body.invoice.add_date).toBeDefined();
      expect(res.body.invoice.paid_date).toEqual(null);
    })
    test("Responds with 400 when JSON data is missing an amount or comp_code variable", async () => {
      const res = await request(app).post('/invoices').send({ 
        comp_code: null, 
        amt: '3500' 
      });
      expect(res.statusCode).toBe(400);
    })
  })
  
  describe("PUT /invoices/:id", () => {
    test("Updates all of the data of a single invoice when passed a valid id paramater and JSON data through the request body", async () => {
      const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ 
        amt: '10000',
        paid: true
      });
    
      expect(res.statusCode).toBe(200);
      expect(res.body.invoice.id).toBeDefined();
      expect(res.body.invoice.comp_code).toEqual('apple');
      expect(res.body.invoice.amt).toEqual(10000);
      expect(res.body.invoice.paid).toEqual(true);
      expect(res.body.invoice.add_date).toBeDefined();
      expect(res.body.invoice.paid_date).not.toEqual(null);

      const res2 = await request(app).put(`/invoices/${testInvoice.id}`).send({ 
        amt: '10000',
        paid: false
      });
    
      expect(res2.statusCode).toBe(200);
      expect(res2.body.invoice.id).toBeDefined();
      expect(res2.body.invoice.comp_code).toEqual('apple');
      expect(res2.body.invoice.amt).toEqual(10000);
      expect(res2.body.invoice.paid).toEqual(false);
      expect(res2.body.invoice.add_date).toBeDefined();
      expect(res2.body.invoice.paid_date).toEqual(null);
    })
    test("Responds with 400 when JSON data includes a paid variable with an invalid value", async () => {
      const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ 
        amt: '10000',
        paid: 'blargh'
      });
      expect(res.statusCode).toBe(400);
    })
    test("Responds with 400 when JSON data is missing an amount variable", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ 
          amt: null,
          paid: true
        });
        expect(res.statusCode).toBe(400);
    })
    test("Responds with 404 when an invalid id parameter is passed", async () => {
        const res = await request(app).put('/invoices/0').send({ 
          amt: '99',
          paid: true
        });
        expect(res.statusCode).toBe(404);
    })
    test("Responds with 400 when a non integer value is passed as id parameter", async () => {
        const res = await request(app).put('/invoices/notNumber').send({ 
          amt: '99',
          paid: true 
        });
        expect(res.statusCode).toBe(400);
    })
  })
  
  describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice when a valid invooice id is passed as a parameter", async () => {
      const res = await request(app).delete(`/invoices/${testInvoice.id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'DELETED' });
    })
    test("Returns with 404 when an invalid invoice id is passed as a parameter", async () => {
      const res = await request(app).delete('/invoices/0');
      expect(res.statusCode).toBe(404);
    })
    test("Returns with 400 when a non integer invoice id is passed as a parameter", async () => {
        const res = await request(app).delete('/invoices/notNumber');
        expect(res.statusCode).toBe(400);
      })
  })
  