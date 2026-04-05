import mongoose from "mongoose";

const trackSchema = new mongoose.Schema({
    trackName: { type: String, required: true },
    description: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
    audioUrl: { type: String, required: true }, 
    imageUrl: { type: String, required: true },  
    createdAt: { type: Date, default: Date.now },
    duration: {type: String}
})

const trackModel = mongoose.model('Track', trackSchema);

export default trackModel;
