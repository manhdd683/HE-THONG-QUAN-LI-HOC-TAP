import { Router } from 'express';
import { login, forgotPassword, resetPassword, requestEmailChange, getPendingEmailRequests, approveEmailChange, rejectEmailChange } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/request-email-change', authenticateToken, requestEmailChange);
router.get('/pending-emails', authenticateToken, getPendingEmailRequests);
router.post('/approve-email/:id', authenticateToken, approveEmailChange);
router.post('/reject-email/:id', authenticateToken, rejectEmailChange);

export default router;
