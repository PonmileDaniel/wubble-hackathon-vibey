//import { getUploadUrl } from "../config/backblaze.js";
import Track from "../models/trackModel.js";
import Album from "../models/albumModel.js";
import userModel from "../models/creatorModel.js";
import { uploadToB2 } from "../config/backblazeProfile.js";



export const uploadProfile = async (req, res) =>{
    try {
        const { bio } = req.body
        const file = req.file;

        let imageUrl = null;

        if (file) {
            // If a new profile image is uploaded, upload to B2
            imageUrl = await uploadToB2(file.buffer, file.originalname, "profile");
          } else {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const updateCreator = await userModel.findByIdAndUpdate(
            req.user._id,
            {
                bio, 
                profileImage: imageUrl || req.user.profileImage,
            },
            { new: true }
        );

        return res.json({
            success: true,
            message: "Profile setup successfully completed",
            creator: updateCreator
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message})
    }
}


export const getCreatorProfile = async (req, res) => {
    const creatorId = req.user._id;

    try {
        const creator = await userModel.findById(creatorId).select('-password -verifyotp -resetOtp')

        if (!creator){
            return res.status(404).json({ success: false, message: 'Creator not found'})
        }

        // Fetch number of albums and tracks
        const albums = await Album.find({ artistId: creatorId });
        const tracks = await Track.find({ artistId: creatorId });

        return res.json({
            success: true,
            creator: {
                _id: creator._id,
                name:  creator.name,
                bio: creator.bio,
                profileImage: creator.profileImage,
                email: creator.email,
                totalAlbums: albums.length,
                totalTracks: tracks.length

            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Update Profile
export const updateCreatorProfile = async (req, res) => {
    const userId = req.user._id;
    const { bio, profileImage } = req.body;

    try {
        const user = await userModel.findByIdAndUpdate(
            userId,
            { bio, profileImage },
            { new: true }
        );
        return res.json({ success: true, user })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};