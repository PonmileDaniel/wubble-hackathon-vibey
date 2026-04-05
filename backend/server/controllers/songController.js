import { getUploadUrl, getSignedUrl, deleteFile  } from "../config/backblaze.js";
import Track from "../models/trackModel.js";
import Album from "../models/albumModel.js";
import userModel from "../models/creatorModel.js";
import dotenv from "dotenv";
import axios from "axios";
import { parseBuffer } from "music-metadata";
import redisClient from "../config/redisClient.js";


dotenv.config();

export const uploadTrack = async (req, res) => {
  try {
    const { title, description, aiAudioUrl } = req.body;
    const creator = req.user._id;

    // Validate image file
    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      return res.status(400).json({ message: 'Image file is required'})
    }

    let audioFile;

    // IF AI AUDIO URL IS PROVIDED: Download it to a buffer
    if (aiAudioUrl) {
      try {
        const audioRes = await axios.get(aiAudioUrl, { responseType: 'arraybuffer' });
        audioFile = {
           buffer: audioRes.data,
           originalname: `ai_generated_${Date.now()}.mp3`,
           mimetype: 'audio/mpeg'
        };
      } catch (err) {
        return res.status(400).json({ message: "Failed to fetch AI audio from Wubble." });
      }
    } else {
      // OTHERWISE: Use the standard file upload
      if (!req.files || !req.files['audio'] || req.files['audio'].length === 0) {
        return res.status(400).json({ message: 'Audio file is required'})
      }
      audioFile = req.files['audio'][0];
    }

    const imageFile = req.files['image'][0];
    
    // Get upload URL
    const { uploadUrl, authorizationToken } = await getUploadUrl(process.env.B2_BUCKET_ID);

    // Function to upload a file using Axios
    async function uploadFile(file, fileName) {
      const headers = {
        Authorization: authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": file.mimetype,
        "X-Bz-Content-Sha1": "do_not_verify",
      };

      const response = await axios.post(uploadUrl, file.buffer, { headers });

      return `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
    }

    /**
     * Timestamp to ensure uniqueness 
     * Upload file and imae file to B2 and gets their public URLS
     */

    const audioFileName = `songs/${Date.now()}_${audioFile.originalname}`;
    const imageFileName = imageFile ? `covers/${Date.now()}_${imageFile.originalname}` : null;

    const audioUrl = await uploadFile(audioFile, audioFileName);
    const imageUrl = imageFile ? await uploadFile(imageFile, imageFileName) : null;

    //  Extract audio metadata (duration)
    const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
    const durationInSeconds = Math.floor(metadata.format.duration || 0);
    const formattedDuration = `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, "0")}`;


    // Save this track into Mongodb 
    const newSong = new Track({
      trackName: title,
      description,
      audioUrl,
      imageUrl,
      artistId: creator,
      duration: formattedDuration
    });

    await newSong.save();
    res.status(201).json({ message: "Song uploaded successfully!", song: newSong });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};



export const uploadAlbum = async (req, res) => {
  try {
    const { albumName, description, trackTitles } = req.body;
    const audioFiles = req.files["tracks"]; // An array of tracks
    const imageFile = req.files['image'][0];
    const creator = req.user._id;
    const parsedTitles = JSON.parse(trackTitles);

    if (!audioFiles || audioFiles.length === 0) {
      return res.status(400).json({ message: "No tracks provided" });
    }

    if (!req.files || !req.files['image'] || req.files['image'].length === 0)
      return res.status(400).json({ message: 'Image file is required' });

    // Function to upload files to Backblaze
    async function uploadFile(file, fileName) {
      try {
        // Get a new upload URL and auth token for each file upload
        const { uploadUrl, authorizationToken } = await getUploadUrl(process.env.B2_BUCKET_ID);

        const headers = {
          Authorization: authorizationToken, // Use the current auth token
          "X-Bz-File-Name": encodeURIComponent(fileName),
          "Content-Type": file.mimetype,
          "X-Bz-Content-Sha1": "do_not_verify",
        };
        
        const response = await axios.post(uploadUrl, file.buffer, { headers });
        return `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
      } catch (err) {
        console.error("Backblaze upload failed:", err.response?.data || err.message);
        throw new Error("File upload failed");
      }
    }

    // Upload album cover
    const imageFileName = imageFile ? `albums/${Date.now()}_${imageFile.originalname}` : null;
    const imageUrl = imageFile ? await uploadFile(imageFile, imageFileName) : null;

    // Create album entry in DB
    const newAlbum = new Album({
      albumName,
      description,
      artistId: creator,
      imageUrl,
    });

    await newAlbum.save();

    // Process and upload each track
    const trackPromises = audioFiles.map(async (audioFile, index) => {

      const audioFileName = `songs/${Date.now()}_${audioFile.originalname}`;

      // Extract metadata (duration)
      const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
      const durationInSeconds = Math.floor(metadata.format.duration || 0);
      const formattedDuration = `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, "0")}`;

      // Upload to Backblaze
      const audioUrl = await uploadFile(audioFile, audioFileName);

      // Save track in DB
      const newTrack = new Track({
        trackName: parsedTitles[index] || audioFile.originalname.split(".")[0], // Use filename as track title if not provided
        description,
        audioUrl,
        artistId: creator,
        albumId: newAlbum._id, // Link track to album
        duration: formattedDuration,
        imageUrl,
      });

      return newTrack.save();
    });

    // Wait for all tracks to be saved
    const savedTracks = await Promise.all(trackPromises);

    // Send response
    res.status(201).json({ 
      message: "Album uploaded successfully!", 
      album: newAlbum, 
      tracks: savedTracks 
    });

  } catch (error) {
    console.error("Backblaze upload failed:", error.response?.data || error.message);
    res.status(500).json({ message: "Something went wrong", error: error.message });
    throw error;
  }
};



// Update getIndiviualTracks to be async and handle await ---

export const getIndiviualTracks = async (req, res) => {
  try {
    const artistId = req.user._id;
    const tracks = await Track.find({ artistId })
      .populate('albumId', 'albumName')
      .populate('artistId', 'name')
      .exec();

    // Use Promise.all to handle multiple async calls efficiently
    const signedTracksPromises = tracks.map(async (track) => {
      const cleanAudioUrl = track.audioUrl.split('?')[0];
      const relativeAudioPath = cleanAudioUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
      const audioCacheUrl = `signedUrl:audio:${relativeAudioPath}`;


      //Check Redis for cached audio Url
      let signedAudioUrl = await redisClient.get(audioCacheUrl); // Await the promis
      if(!signedAudioUrl){
        signedAudioUrl = await getSignedUrl(relativeAudioPath);

        if (signedAudioUrl) {
          await redisClient.setEx(audioCacheUrl, 43200, signedAudioUrl); // Cache for 1 hour
        }
      }
      return {
        ...track.toObject(), // Use toObject() if track is a Mongoose document
        audioUrl: signedAudioUrl, // Use the generated signed URL
        // imageUrl: signedImageUrl, // Use the generated signed URL
      };
    });

    // Wait for all signed URLs to be generated
    const signedTracks = await Promise.all(signedTracksPromises);

     // Filter out tracks where URL generation failed, if necessary
     const validSignedTracks = signedTracks.filter(track => track.audioUrl !== null);


    return res.status(200).json({
      success: true,
      tracks: validSignedTracks, // Send only tracks with valid URLs
    });

  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error fetching tracks", // Provide a default message
    });
  }
};



//Get Individual Album based on the artistId 
export const getIndiviualAlbums = async (req, res) => {
  try {
    const artistId = req.user._id;

    const albums = await Album.find({ artistId })
      .populate('artistId', 'name')
      .exec();

    const signedAlbumsPromises = albums.map(async (album) => {
      let signedImageUrl = null;

      if (album.imageUrl) {
        const cleanImageUrl = album.imageUrl.split('?')[0];
        const relativeImagePath = cleanImageUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
        const redisKey = `signed:album-image:${relativeImagePath}`;

        // Try fetching signed URL from Redis
        signedImageUrl = await redisClient.get(redisKey);

        if (!signedImageUrl) {
          // Generate a new signed URL
          signedImageUrl = await getSignedUrl(relativeImagePath);

          if (signedImageUrl) {
            // Cache it in Redis with a TTL of 12hr 
            await redisClient.setEx(redisKey, 43200, signedImageUrl);
          } else {
            console.warn(`Failed to sign album image for: ${relativeImagePath}`);
          }
        }

        album.imageUrl = signedImageUrl;
      }

      return album;
    });

    const signedAlbums = await Promise.all(signedAlbumsPromises);

    return res.status(200).json({
      success: true,
      albums: signedAlbums,
    });

  } catch (error) {
    console.error("Error Fetching albums:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error fetching albums"
    });
  }
};


export const deleteTracks = async(req, res) => {
  try {
    const trackId = req.params.trackId;
    const artistId = req.user._id;

    const track = await Track.findOne({ _id: trackId, artistId });

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found or unauthorized'});
    }
    const albumId = track.albumId;
    let albumDeleted = false;
    let albumName = '';

    try {
      await deleteFile(track.audioUrl);
      console.log('Audio file deleted successfully')

      if (track.imageUrl && !albumId) {
        await deleteFile(track.imageUrl);
        console.log('Image file deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting files from Backblaze:', error)
    }

    // Delete from MongoDB
    const deleteResult = await Track.deleteOne({ _id: trackId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Failed to delete track from database'});
    }

    // Clear any cached signed URLs from Redis
    try {
      const audioPath = track.audioUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
      const imagePath = track.imageUrl ? track.imageUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '') : null;

      await redisClient.del(`signedUrl:audio:${audioPath}`);

      if (imagePath) {
        await redisClient.del(`signed:album-image:${imagePath}`);
      }
      
    } catch (error) {
      console.error('Error clearing Redis cache:', error)
    }

    //  If this track was part of an album, check if it was the last track
    if(albumId){
      //  Count how many tracks remain in this album
      const tracksRemaining = await Track.countDocuments({ albumId });

      
      // If no tracks remain, delete the album
      if (tracksRemaining === 0) {
        const album = await Album.findById(albumId);

        if(album) {
          albumName = album.albumName;

          // Delete album Image
          if (album.imageUrl){
            try {
              await deleteFile(album.imageUrl);
              console.log(`Album image deleted for empty album: ${album.albumName}`);
              
              const imagePath = album.imageUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
              await redisClient.del(`signed:album-image:${imagePath}`);
              
            } catch (error) {
              console.error('Error deleting album image:', error);
            }
          }
          //Delete the album itself 
          await Album.deleteOne({ _id: albumId });
          albumDeleted = true;
          console.log(`Empty album deleted: ${album.albumName}`);
        }
      }
    }

    //  Return appropriate success message
    if (albumDeleted) {
      res.status(200).json({ success: true, message: 'Track successfully deleted '})
    }else {
      res.status(200).json({ 
        success: true, 
        message: `Track deleted successfully. Empty album "${albumName}" was also removed.` 
      });
    }
  } catch (error) {
    console.log('Error deleting track:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting track' });
  }
};



export const getAllTracks = async (req, res) => {
  try {
    // Fetch all tracks from the database and populate artist information.
    const tracks = await Track.find()
      .populate('artistId', 'name') // Only load the artist's name
      .exec();

    // Use Promise.all to handle multiple async calls efficiently.
    const signedTracksPromises = tracks.map(async (track) => {
      // Extract the audio URL and generate a signed URL.
      const cleanAudioUrl = track.audioUrl.split('?')[0];
      const relativeAudioPath = cleanAudioUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
      const audioCacheUrl = `signedUrl:audio:${relativeAudioPath}`;

      let signedAudioUrl = await redisClient.get(audioCacheUrl);
      if (!signedAudioUrl) {
        signedAudioUrl = await getSignedUrl(relativeAudioPath);
        if (signedAudioUrl) {
          await redisClient.setEx(audioCacheUrl, 43200, signedAudioUrl); // Cache for 12 hours.
        }
      }

      // Extract the image URL and generate a signed URL (if available).
      let signedImageUrl = null;
      if (track.imageUrl) {
        const cleanImageUrl = track.imageUrl.split('?')[0];
        const relativeImagePath = cleanImageUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
        const imageCacheUrl = `signedUrl:image:${relativeImagePath}`;

        signedImageUrl = await redisClient.get(imageCacheUrl);
        if (!signedImageUrl) {
          signedImageUrl = await getSignedUrl(relativeImagePath);
          if (signedImageUrl) {
            await redisClient.setEx(imageCacheUrl, 43200, signedImageUrl); // Cache for 12 hours.
          }
        }
      }

      // Return only the necessary data for the listener.
      return {
        trackName: track.trackName, // Name of the track
        audioUrl: signedAudioUrl, // Signed URL for audio file
        imageUrl: signedImageUrl, // Signed URL for image (optional)
        artistName: track.artistId.name, // Artist's name
        createdAt: track.createdAt, // Timestamp of when the track was uploaded
      };
    });

    // Wait for all signed URLs to be generated.
    const signedTracks = await Promise.all(signedTracksPromises);

    // Send the tracks as the response.
    return res.status(200).json({
      success: true,
      tracks: signedTracks, // Send only the required track details.
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error fetching tracks",
    });
  }
};



// Fetch all albums
export const getAllAlbums = async (req, res) => {
  try {

    const albums = await Album.find().populate('artistId', 'name').exec();


    const processedAlbumsPromises = albums.map(async(album) => {
      let signedImageUrl = null;

      // Generate signed URL for album image if it exists
      if (album.imageUrl) {
        // Clean the image URL by removing any query parameters
        const cleanImageUrl = album.imageUrl.split('?')[0];
        // Extract the relative path from the full URL by removing domain and bucket info
        const relativeImagePath = cleanImageUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
        // Create a unique Redis key for this album image
        const redisKey = `signed:album-image:${relativeImagePath}`;

        // Try to retrieve a previously generated signed URL from Redis cache
        signedImageUrl = await redisClient.get(redisKey);

        //If url not found in cache, generate a new one
        if(!signedImageUrl) {
          // Call utility function to generate a new signed URL
          signedImageUrl = await getSignedUrl(relativeImagePath);

          if (signedImageUrl){
            //Cache the newly generated URL in Redis with a 12 hr expiration
            await redisClient.setEx(redisKey, 43200, signedImageUrl);
          }
          else{
            console.warn(`Failed to sign album image for: ${relativeImagePath}`);
          }
        }
        // Update the album object with the signed Url
        album.imageUrl = signedImageUrl;
      }
      // Fetch all tracks associated with the album using the albumId
      const tracks = await Track.find({ albumId: album._id}).exec();

      //Process each track to generate signed URLs for audio files
      const processedTracksPromises = tracks.map(async (track) => {
        // Convert Mongoose doc to a plain js obj
        const trackObj = track.toObject();

        // Since tracks use the same image as the album, reuse the album's signed image URL
        // This optimizes performance by avoiding redundant signing operations
        trackObj.imageUrl = signedImageUrl;

        //  Generate signed URL for track audio file if it exists
        if(track.audioUrl) {
          const cleanAudioUrl = track.audioUrl.split('?')[0];
          const relativeAudioPath = cleanAudioUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');
          const redisKey = `signed:track-audio:${relativeAudioPath}`;

          let signedAudioUrl = await redisClient.get(redisKey);

          if (!signedAudioUrl){
            signedAudioUrl = await getSignedUrl(relativeAudioPath);

            if (signedAudioUrl){
              await redisClient.setEx(redisKey, 43200, signedAudioUrl);
            } else {
              console.warn(`Failed to sign track audio for: ${relativeAudioPath}`);
            }
          }
          // Update the track object with the signed audio URL
          trackObj.audioUrl = signedAudioUrl;
        }
        return trackObj;
      });
      // Wait for all track processing to complete
      const processedTracks = await Promise.all(processedTracksPromises);
      const albumObj = album.toObject();
      // Add the processed tracks to the album object
      albumObj.tracks = processedTracks;
      return albumObj;
    });

    const processedAlbums = await Promise.all(processedAlbumsPromises);

    return res.status(200).json({
      success: true, 
      albums: processedAlbums,
    });
  } catch (error) {
    console.log("Error Fetching albums");
    res.status(500).json({success: false, message: error.message})
  };
}


export const getAllArtists = async (req, res) => {
  try {
    // Fetch all artists from the database, only name field
    const artistIds = await Track.distinct('artistId');

    // Get the user details for these artists
    const artists = await userModel.find({ _id: { $in: artistIds } }).select('name');
    
    
    // Process each artist to include track/album counts only
    const processedArtistsPromises = artists.map(async (artist) => {
      // Count tracks and albums for this artist
      const trackCount = await Track.countDocuments({ artistId: artist._id });
      const albumCount = await Album.countDocuments({ artistId: artist._id });
      
      // Create a simplified artist object with counts
      return {
        name: artist.name,
        trackCount,
        albumCount
      };
    });
    
    const processedArtists = await Promise.all(processedArtistsPromises);
    
    return res.status(200).json({
      success: true,
      artists: processedArtists
    });
    
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error fetching artists'
    });
  }
};