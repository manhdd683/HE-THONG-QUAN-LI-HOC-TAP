const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const sqlite = new Database('prisma/dev.db', { readonly: true });
  const prisma = new PrismaClient();

  const convertDates = (obj) => {
    const res = { ...obj };
    for (const key in res) {
      if (res[key] !== null && (key.endsWith('_at') || key.endsWith('_date') || key === 'date' || key === 'date_of_birth' || key === 'achieved_date')) {
        res[key] = new Date(res[key]);
      }
    }
    return res;
  };

  try {
    const tables = [
      'User', 'Student', 'StudentSubject', 'Goal', 'Schedule', 'TuitionCycle', 'Session', 
      'Score', 'SubjectScoreBoard', 'ScoreHistory', 'Comment', 'Homework', 'Document', 
      'Payment', 'ReportHistory', 'ActivityLog', 'Settings', 'CommentTemplate', 'Achievement'
    ];

    for (const table of tables) {
      console.log(`Migrating ${table}...`);
      try {
        const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();
        for (const row of rows) {
          const data = convertDates(row);
          // For models in Prisma, the model name is lowercase of table usually
          let modelName = table.charAt(0).toLowerCase() + table.slice(1);
          
          if (table === 'SubjectScoreBoard') modelName = 'subjectScoreBoard';
          else if (table === 'StudentSubject') modelName = 'studentSubject';
          else if (table === 'ScoreHistory') modelName = 'scoreHistory';
          else if (table === 'TuitionCycle') modelName = 'tuitionCycle';
          else if (table === 'ReportHistory') modelName = 'reportHistory';
          else if (table === 'ActivityLog') modelName = 'activityLog';
          else if (table === 'CommentTemplate') modelName = 'commentTemplate';

          if (table === 'SubjectScoreBoard') {
            await prisma[modelName].upsert({
              where: { student_id_subject: { student_id: data.student_id, subject: data.subject } },
              update: {},
              create: data
            });
          } else if (table === 'Session') {
            await prisma[modelName].upsert({
              where: { schedule_id: data.schedule_id },
              update: {},
              create: data
            });
          } else if (table === 'Settings') {
            await prisma[modelName].upsert({
              where: { key: data.key },
              update: {},
              create: data
            });
          } else {
            if (data.id) {
              await prisma[modelName].upsert({
                where: { id: data.id },
                update: {},
                create: data
              });
            }
          }
        }
      } catch (e) {
        console.log(`Table ${table} skipped or error: ${e.message}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error migrating data:', error);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
