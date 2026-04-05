import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verifyotp: { type: String, default: '' },
    verifyotpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: '' },
    resetOtpExpiresAt: { type: Number, default: 0 },

    // Additional fields for creator profile
    bio: { type: String, default:''},
    profileImage: { type: String, default: ''},
    wubbleApiKey: { type: String, default: '' }

})

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
