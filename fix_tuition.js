const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/tuition.controller.ts', 'utf8');

const hook = `      // Just update them after creation
      await prisma.session.updateMany({
        where: { id: { in: session_ids } },
        data: { tuition_cycle_id: cycle.id }
      });
      
      // Auto-create Scoreboard if subject exists
      if (subject && subject.trim() !== '') {
        await prisma.subjectScoreBoard.create({
          data: {
            student_id,
            subject,
            title: name || \`Bảng điểm \${subject}\`
          }
        });
      }
      
      res.status(201).json(cycle);`;
      
const hookNoSession = `      const cycle = await prisma.tuitionCycle.create({
        data: {
          student_id,
          name,
          subject: subject || null,
          start_date: new Date(),
          total_sessions: parseInt(total_sessions),
          price_per_session: final_price,
          total_amount,
          status: 'UNPAID'
        },
        include: {
          student: true
        }
      });
      
      // Auto-create Scoreboard if subject exists
      if (subject && subject.trim() !== '') {
        await prisma.subjectScoreBoard.create({
          data: {
            student_id,
            subject,
            title: name || \`Bảng điểm \${subject}\`
          }
        });
      }
      
      res.status(201).json(cycle);`;

content = content.replace(`      // Just update them after creation
      await prisma.session.updateMany({
        where: { id: { in: session_ids } },
        data: { tuition_cycle_id: cycle.id }
      });
      res.status(201).json(cycle);`, hook);
      
content = content.replace(`      const cycle = await prisma.tuitionCycle.create({
        data: {
          student_id,
          name,
          subject: subject || null,
          start_date: new Date(),
          total_sessions: parseInt(total_sessions),
          price_per_session: final_price,
          total_amount,
          status: 'UNPAID'
        },
        include: {
          student: true
        }
      });
      res.status(201).json(cycle);`, hookNoSession);

fs.writeFileSync('server/src/controllers/tuition.controller.ts', Buffer.from(content, 'utf8'));
console.log('tuition.controller updated.');
