const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://he_thong_quan_li_hoc_tap_db_user:c6TFlperGEd4CzAwpfC6u42A4AUqllAY@dpg-daq9t1id0e5s739qjec0-a.singapore-postgres.render.com/he_thong_quan_li_hoc_tap_db',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log(res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.message);
    client.end();
  });
