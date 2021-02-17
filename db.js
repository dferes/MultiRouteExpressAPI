const { Client } = requre ('pg');
let DB_URI;

DB_URI = process.env.NODE_ENV === 'test' ? 'postgresql:///biztime': 'postgresql:///biztime_test';

let db = new Client({
    connectionstring: DB_URI
});

db.connect();

module.exports = db;