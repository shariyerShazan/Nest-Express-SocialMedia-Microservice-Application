import { Router } from 'express';
import { ChatController } from './chat.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { requireAuth } from '../../middlewares/authMiddleware';
import { startChatSchema, getHistorySchema } from './dto/chat.schema';

const router = Router();

router.use(requireAuth);

router.post('/start', validateRequest(startChatSchema), ChatController.startChat);
router.get('/:roomId/history', validateRequest(getHistorySchema), ChatController.getHistory);
router.get('/active', ChatController.getActiveChats);

export { router as chatRoutes };
