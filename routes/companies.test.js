process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
  const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('google', 'Google', 'Overlords') RETURNING code, name, description`);
  await db.query(`INSERT INTO companies (code, name, description) VALUES ('ikea', 'IKEA', 'We overcharge you to build your own stuff') RETURNING code, name, description`);
  testCompany = result.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /companies", () => {
  test("Get a list of all companies when no code variable is passed as a query parameter", async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toEqual(200);
    expect(res.body.companies.length).toEqual(2);
    expect(res.body.companies[0].code).toEqual('google');
    expect(res.body.companies[0].name).toEqual('Google');
  })
})

describe("GET /companies/:code", () => {
  test("Retrievs a single user when a valid company code parameter is passed in", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`)
    expect(res.statusCode).toBe(200);
    expect(res.body.company.code).toEqual(testCompany.code);
    expect(res.body.company.name).toEqual(testCompany.name);
    expect(res.body.company.description).toEqual(testCompany.description)
  })
  test("Responds with 404 when an invalid company code is passed in", async () => {
    const res = await request(app).get(`/companies/amazon`)
    expect(res.statusCode).toBe(404);
  })
})

describe("POST /companies", () => {
  test("Creates a single company when code, name, description JSON data is correctly passed in", async () => {
    const res = await request(app).post('/companies').send({ 
      code: 'amazon', 
      name: 'Amazon', 
      description: 'We own the world' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: 'amazon', name: 'Amazon', description: 'We own the world' }
    })
  })
  test("Responds with 400 when JSON data is missing a code variable", async () => {
    const res = await request(app).post('/companies').send({ 
      code: null, 
      name: 'Amazon', 
      description: 'We own the world' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toEqual('Missing JSON data, must provide a company code, name, and description')
  })
})

describe("PUT /companies/:id", () => {
  test("Updates all of a single companies data when valid code is sent as parameter and name, description sent as JSON", async () => {
    const res = await request(app).put('/companies/ikea').send({ 
      name: 'SuperIKEA', description: 'Build it yourself!' });
    expect(res.statusCode).toBe(200);
    console.log('----------------------------------');
    console.log(res.body);
    expect(res.body).toEqual({
      company: { code: 'ikea', name: 'SuperIKEA', description: 'Build it yourself!' }
    })
  })
  test("Responds with 404 when an invalid company code is passed", async () => {
    const res = await request(app).put(`/companies/ikeaaa`).send({ 
      name: 'SuperIKEA', description: 'Build it yourself!' 
    });
    expect(res.statusCode).toBe(404);
  })
})

describe("DELETE /companies/:id", () => {
  test("Deletes a single user when a valid company code is passed as a parameter", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'DELETED' });
  })
  test("Returns with 404 when an invalid company code is passed as a parameter", async () => {
    const res = await request(app).delete('/companies/fakeCode');
    expect(res.statusCode).toBe(404);
  })
})
