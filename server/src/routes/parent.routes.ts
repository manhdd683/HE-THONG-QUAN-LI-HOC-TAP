import { Router } from 'express';
import { getParents, createParent, updateParent, requestEmailChange, approveEmailChange } from '../controllers/parent.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Parent routes
router.put('/request-email-change', requireRole('PARENT'), requestEmailChange);

// Tutor routes
router.get('/', requireRole('TUTOR'), getParents);
router.post('/', requireRole('TUTOR'), createParent);
router.put('/:id', requireRole('TUTOR'), updateParent);
router.put('/:id/approve-email', requireRole('TUTOR'), approveEmailChange);

export default router;
