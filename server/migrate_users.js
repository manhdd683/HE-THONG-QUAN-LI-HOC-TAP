const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const sqlite = new Database('prisma/dev.db', { readonly: true });
  const prisma = new PrismaClient();

  try {
    console.log('Migrating User...');
    const users = sqlite.prepare('SELECT * FROM User').all();
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          password_hash: u.password_hash,
          role: u.role,
          name: u.name,
          phone: u.phone,
          status: u.status,
          avatar_url: u.avatar_url,
          created_at: new Date(u.created_at),
          updated_at: new Date(u.updated_at)
        }
      });
    }

    console.log('Migrating Student...');
    const students = sqlite.prepare('SELECT * FROM Student').all();
    for (const s of students) {
      await prisma.student.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          name: s.name,
          date_of_birth: s.date_of_birth ? new Date(s.date_of_birth) : null,
          gender: s.gender,
          parent_id: s.parent_id,
          phone: s.phone,
          school: s.school,
          grade: s.grade,
          address: s.address,
          status: s.status,
          notes: s.notes,
          avatar_url: s.avatar_url,
          created_at: new Date(s.created_at),
          updated_at: new Date(s.updated_at)
        }
      });
    }

    console.log('Migrating Subjects, Goals, etc (if any)...');
    
    console.log('Migration completed successfully for Users and Students.');
  } catch (error) {
    console.error('Error migrating data:', error);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
