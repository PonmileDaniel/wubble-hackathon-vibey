import mongoose from "mongoose";

const listenerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetOtp: { type: String, default: '' },
    resetOtpExpiresAt: { type: Number, default: 0 },

})

const listenerModel = mongoose.models.listener || mongoose.model('listener', listenerSchema);

export default listenerModel;
