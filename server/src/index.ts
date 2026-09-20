import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import parentRoutes from './routes/parent.routes';
import studentRoutes from './routes/student.routes';
import dashboardRoutes from './routes/dashboard.routes';
import scheduleRoutes from './routes/schedule.routes';
import homeworkRoutes from './routes/homework.routes';
import tuitionRoutes from './routes/tuition.routes';
import reportRoutes from './routes/report.routes';
import uploadRoutes from './routes/upload.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/tuition', tuitionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
