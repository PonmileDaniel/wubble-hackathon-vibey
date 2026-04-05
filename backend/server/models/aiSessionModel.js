import mongoose from "mongoose";

const aiSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    projectId: { type: String, required: true }, // Wubble's project_id
    title: { type: String, default: "New Music Session" },
    history: [{
        prompt: String,
        requestId: String,
        audioUrl: String,
        status: { type: String, default: "processing" },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const AiSession = mongoose.model('AiSession', aiSessionSchema);
export default AiSession;