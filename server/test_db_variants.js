const { Client } = require('pg');

const urls = [
  'postgresql://he_thong_quan_li_hoc_tap_db_user:c6TFlperGEd4CzAwpfC6u42A4AUqllAY@dpg-daq9t1id0e5s739qjec0-a.singapore-postgres.render.com/he_thong_quan_li_hoc_tap_db',
  'postgresql://he_thong_quan_li_hoc_tap_db_user:c6TF1perGEd4CzAwpfC6u42A4AUq11AY@dpg-daq9t1id0e5s739qjec0-a.singapore-postgres.render.com/he_thong_quan_li_hoc_tap_db',
  'postgresql://he_thong_quan_li_hoc_tap_db_user:c6TFlperGEd4CzAwpfC6u42A4AUqllAY@dpg-daq9tlid0e5s739qjec0-a.singapore-postgres.render.com/he_thong_quan_li_hoc_tap_db',
  'postgresql://he_thong_quan_li_hoc_tap_db_user:c6TF1perGEd4CzAwpfC6u42A4AUq11AY@dpg-daq9tlid0e5s739qjec0-a.singapore-postgres.render.com/he_thong_quan_li_hoc_tap_db'
];

async function testAll() {
  for (let i = 0; i < urls.length; i++) {
    const client = new Client({
      connectionString: urls[i],
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`SUCCESS with URL index ${i}`);
      const res = await client.query('SELECT NOW()');
      console.log(res.rows[0]);
      await client.end();
      return;
    } catch (err) {
      console.log(`URL ${i} failed: ${err.message}`);
    }
  }
}
testAll();
