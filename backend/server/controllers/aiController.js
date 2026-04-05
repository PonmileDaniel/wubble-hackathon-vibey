import axios from "axios";
import AiSession from "../models/aiSessionModel.js";
import userModel from "../models/creatorModel.js";

// Generate a new AI track (Starts or continues a session)
export const generateAiTrack = async (req, res) => {
    try {
        const { prompt, projectId } = req.body;
        const userId = req.user._id;

        // Fetch user to get their Wubble API Key
        const user = await userModel.findById(userId);
        if (!user || !user.wubbleApiKey) {
            return res.status(401).json({ success: false, message: "No Wubble API Key found for this account." });
        }

        const payload = { prompt, vo: true };
        if (projectId) payload.project_id = projectId;

        // Call Wubble API
        const response = await axios.post('https://api.wubble.ai/api/v1/chat', payload, {
            headers: { Authorization: `Bearer ${user.wubbleApiKey}` }
        });

        const newProjectId = response.data.project_id;
        const requestId = response.data.request_id;

        // Save or update session in DB
        let session = await AiSession.findOne({ projectId: newProjectId, userId });
        
        if (!session) {
            session = new AiSession({ userId, projectId: newProjectId, title: prompt.substring(0, 30) + '...' });
        }
        
        session.history.push({ prompt, requestId });
        session.updatedAt = Date.now();
        await session.save();

        res.status(200).json({ success: true, projectId: newProjectId, requestId });
    } catch (error) {
        console.error("Wubble AI Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Failed to start AI generation" });
    }
};

// Poll for the status of a specific request
export const pollAiStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const user = await userModel.findById(userId);

        const response = await axios.get(`https://api.wubble.ai/api/v1/polling/${requestId}`, {
            headers: { Authorization: `Bearer ${user.wubbleApiKey}` }
        });

        const statusData = response.data;

        // If completed, update the DB so we retain the track
        if (statusData.status === 'completed') {
            const finalAudio = statusData.streaming?.final_audio_url;
            await AiSession.updateOne(
                { userId, "history.requestId": requestId },
                { $set: { "history.$.status": "completed", "history.$.audioUrl": finalAudio } }
            );
        }

        res.status(200).json({ success: true, data: statusData });
    } catch (error) {
        console.error("Wubble Polling Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Error checking status" });
    }
};

// Fetch all AI sessions for a user
export const getUserAiSessions = async (req, res) => {
    try {
        const userId = req.user._id;
        // Fetch sessions and sort by most recently updated
        const sessions = await AiSession.find({ userId }).sort({ updatedAt: -1 });
        
        res.status(200).json({ success: true, sessions });
    } catch (error) {
        console.error("Fetch sessions error:", error);
        res.status(500).json({ success: false, message: "Error fetching sessions" });
    }
};