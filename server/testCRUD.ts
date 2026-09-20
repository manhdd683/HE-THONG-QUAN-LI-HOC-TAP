import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCRUD() {
  console.log('--- STARTING CRUD TEST ---');
  try {
    const jwt = require('jsonwebtoken');
    const user = await prisma.user.findFirst({ where: { role: 'TUTOR' } });
    if (!user) throw new Error('User not found');
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
    console.log('Got token');

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Read Schedules
    let res = await fetch('http://localhost:5000/api/schedules', { headers });
    let data = await res.json();
    console.log(`[READ] Success, found ${data.length} schedules`);
    
    // 3. Create Schedule
    const student = await prisma.student.findFirst({ where: { tutor_id: user.id } });
    if (!student) throw new Error('No student found for this tutor');

    const createPayload = {
      student_id: student.id,
      subject: 'Test Subject',
      date: new Date().toISOString(),
      start_time: '10:00',
      end_time: '11:00',
      format: 'ONLINE',
      location: '',
      notes: 'Test notes',
      recurring_weeks: 1
    };
    res = await fetch('http://localhost:5000/api/schedules', { method: 'POST', headers, body: JSON.stringify(createPayload) });
    data = await res.json();
    console.log(`[CREATE] Success, created schedule with ID: ${data.id || data.message}`);
    
    // If it returns message like "Created 1 schedules", we need to fetch again to get the last one
    let newScheduleId = data.id;
    if (!newScheduleId) {
       const latest = await prisma.schedule.findFirst({ orderBy: { created_at: 'desc' } });
       newScheduleId = latest!.id;
    }

    // 4. Update Schedule
    const updatePayload = {
      ...createPayload,
      subject: 'Updated Subject'
    };
    res = await fetch(`http://localhost:5000/api/schedules/${newScheduleId}`, { method: 'PUT', headers, body: JSON.stringify(updatePayload) });
    data = await res.json();
    console.log(`[UPDATE] Success, subject is now: ${data.subject}`);

    // 5. Mark Attendance
    const attendancePayload = {
      attendance: 'PRESENT',
      content: 'Taught test subjects',
      understanding_level: 'Good',
      attitude: 'Good',
      strengths: 'None',
      weaknesses: 'None'
    };
    res = await fetch(`http://localhost:5000/api/schedules/${newScheduleId}/attendance`, { method: 'POST', headers, body: JSON.stringify(attendancePayload) });
    data = await res.json();
    console.log(`[ATTENDANCE] Success, marked attendance`);

    // 6. Delete Schedule
    res = await fetch(`http://localhost:5000/api/schedules/${newScheduleId}`, { method: 'DELETE', headers });
    data = await res.json();
    console.log(`[DELETE] Success, status: ${res.status}, message: ${data.message || data.error}`);

    // 7. Verify Deletion
    const checkDeleted = await prisma.schedule.findUnique({ where: { id: newScheduleId } });
    if (!checkDeleted) {
      console.log(`[VERIFY] Schedule successfully deleted from DB.`);
    } else {
      console.log(`[VERIFY ERROR] Schedule STILL EXISTS in DB!`);
    }

  } catch (error: any) {
    console.error('ERROR OCCURRED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCRUD();
