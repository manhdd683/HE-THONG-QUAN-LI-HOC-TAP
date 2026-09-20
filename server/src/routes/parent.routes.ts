import { Router } from 'express';
import { getParents, createParent, updateParent, requestEmailChange, approveEmailChange, deleteParent } from '../controllers/parent.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Parent routes
router.put('/request-email-change', requireRole('PARENT'), requestEmailChange);

// Tutor routes for managing parents
router.get('/', requireRole('TUTOR'), getParents);
router.post('/', requireRole('TUTOR'), createParent);
router.put('/:id', requireRole('TUTOR'), updateParent);
router.delete('/:id', requireRole('TUTOR'), deleteParent);
router.put('/:id/approve-email', requireRole('TUTOR'), approveEmailChange);

export default router;
