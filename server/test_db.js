const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://he_thong_quan_li_hoc_tap_db_user:c6TF1perGEd4CzAwpfC6u42A4AUq11AY@dpg-daq9t1id0e5s739qjec0-a.singapore-postgres.render.com/he_thong_quan_li_hoc_tap_db?ssl=true'
});
client.connect()
  .then(() => {
    console.log('Connected to Render PostgreSQL!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log(res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    client.end();
  });
