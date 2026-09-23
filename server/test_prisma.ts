import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
  try {
    const parent_email = `test_${Date.now()}@gmail.com`;
    const parent_name = "Nguyen An";
    const parent_password = "password123";
    
    console.log("Hashing password...");
    const password_hash = await bcrypt.hash(parent_password, 10);
    
    console.log("Creating parent...");
    const newParent = await prisma.user.create({
      data: {
        email: parent_email,
        name: parent_name,
        phone: "0987654321",
        password_hash,
        role: 'PARENT'
      }
    });
    console.log("Parent created:", newParent.id);

    console.log("Fetching tutor...");
    const tutor = await prisma.user.findFirst({ where: { role: 'TUTOR' } });
    if (!tutor) throw new Error("No tutor found");

    console.log("Creating student...");
    const student = await prisma.student.create({
      data: {
        name: "Tran Quynh Chi",
        student_code: `HS_${Date.now()}`,
        parent_id: newParent.id,
        tutor_id: tutor.id,
        dob: null,
        gender: "Nam",
        school: "",
        grade: "Lớp 7",
        start_date: new Date("2026-09-22"),
        status: 'ACTIVE',
        student_subjects: {
          create: [
            { subject: "Toán", price_per_session: 120000 },
            { subject: "Tiếng anh", price_per_session: 200000 }
          ]
        }
      }
    });

    console.log("Success:", student);
  } catch (err: any) {
    console.error("Failed:", err.message, err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
