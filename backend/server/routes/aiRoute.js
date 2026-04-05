import express from 'express';
import { generateAiTrack, pollAiStatus, getUserAiSessions } from '../controllers/aiController.js';
import userAuth from '../middleware/userAuth.js';

const aiRoute = express.Router();

aiRoute.post('/generate', userAuth, generateAiTrack);
aiRoute.get('/status/:requestId', userAuth, pollAiStatus);
aiRoute.get('/sessions', userAuth, getUserAiSessions); // <--- Add this line

export default aiRoute;