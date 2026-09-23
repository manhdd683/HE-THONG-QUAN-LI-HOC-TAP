const fs = require('fs');
const file = 'server/src/controllers/tuition.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const newFunc = `
export const getStudentTuitionCycles = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const cycles = await prisma.tuitionCycle.findMany({
      where: { student_id: studentId },
      orderBy: { start_date: 'desc' }
    });
    res.json(cycles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student cycles' });
  }
};
`;

content = content + newFunc;
fs.writeFileSync(file, content);
console.log('Added getStudentTuitionCycles');
