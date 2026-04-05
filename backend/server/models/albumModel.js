import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
    albumName: {type: String, required: true},
    description: {type: String, required: true},
    artistId: {type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    imageUrl: {type: String, required: true},
    createdAt: { type: Date, default: Date.now }
});

const Album = mongoose.model('Album', albumSchema);
export default Album;