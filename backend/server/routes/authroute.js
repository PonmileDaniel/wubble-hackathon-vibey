import express from 'express'
import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyotp, verifyEmail } from '../controllers/authcontroller.js';
import userAuth from '../middleware/userAuth.js';
import { getCreatorProfile, uploadProfile } from '../controllers/profilecontroller.js';
import { upload } from '../multer/multer.js';

const authRouter = express.Router();
authRouter.post('/register', register)
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyotp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.post('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

authRouter.post('/upload-profile', userAuth, upload.single("profileImage"), uploadProfile)

authRouter.get('/get-profile', userAuth, getCreatorProfile);

export default authRouter;