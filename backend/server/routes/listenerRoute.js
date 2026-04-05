import express from 'express'
import { login, logout, register, resetPassword, sendResetOtp } from '../controllers/listenerController.js';


const listenerRouter = express.Router();
listenerRouter.post('/register', register)
listenerRouter.post('/login', login);
listenerRouter.post('/logout', logout);
listenerRouter.post('/send-reset-otp', sendResetOtp);
listenerRouter.post('/reset-password', resetPassword);


export default listenerRouter;