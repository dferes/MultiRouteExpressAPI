const { Client } = requre ('pg');
let DB_URI;

DB_URI = process.env.NODE_ENV === 'test' ? 'postgresql:///biztime_test' : 'postgresql:///biztime';

let db = new Client({
    connectionstring: DB_URI
});

db.connect();

module.exports = db;