// UploadForm.jsx
import React, { useState } from 'react';
import './CreatorUpload.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import AlbumTrackFields from './AlbumTrackFields';

const apiSongUrl=import.meta.env.VITE_API_URL_SONG

const UploadForm = ({ uploadType, prefillAiData, setPrefillAiData }) => {
  // Use prefill title if available
  const [title, setTitle] = useState(prefillAiData ? prefillAiData.title : '');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([{ id: 1, title: '', audioFile: null }]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle selecting a cover image file
  const handleImageUpload = (e) => {
    if (e.target.files?.[0]) setCoverImage(e.target.files[0]);
  };

  // Handle selecting a single track audio file
  const handleAudioUpload = (e) => {
    if (e.target.files?.[0]) setAudioFile(e.target.files[0]);
  };

  // Handle form submission for both track and album uploads
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for required fields
    if (uploadType === 'track') {
      // Now accepts either an audioFile OR the prefilled AI URL
      if (!audioFile && !prefillAiData) {
        return toast.error('Audio file or AI track and cover image are required!');
      }
      if (!coverImage) return toast.error('Cover image is required!');
    } else {
      const hasInvalidTrack = albumTracks.some((t) => !t.audioFile || !t.title);
      if (!coverImage || hasInvalidTrack) {
        return toast.error('All album tracks need title & audio, and cover is required!');
      }
    }

    // Create FormData object to send files and data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', coverImage);

    if (uploadType === 'track') {
      if (prefillAiData) {
        // Send the AI URL to the backend
        formData.append('aiAudioUrl', prefillAiData.url);
      } else {
        // Standard upload
        formData.append('audio', audioFile);
      }
    } else {
      // Album processing
      formData.append('albumName', title);
      albumTracks.forEach((track) => formData.append('tracks', track.audioFile));
      formData.append('trackTitles', JSON.stringify(albumTracks.map((t) => t.title)));
    }

    try {
      setIsUploading(true);

      // Axios config for POST request
      const config = {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data', timeout: 15000 },
      };

      // Decide which endpoint to use based on uploadType
      const endpoint =
        uploadType === 'album'
          ? `${apiSongUrl}/upload-album`
          : `${apiSongUrl}/upload`;

      // Send POST request
      const res = await axios.post(endpoint, formData, config);

      // If successful, reset form and show success toast
      if (res.status === 201) {
        toast.success(`${uploadType === 'track' ? 'Track' : 'Album'} uploaded successfully!`);
        setTitle('');
        setDescription('');
        setCoverImage(null);
        setAudioFile(null);
        if (setPrefillAiData) setPrefillAiData(null); // Clear the passed AI data
        setAlbumTracks([{ id: 1, title: '', audioFile: null }]);
      }
    } catch (error) {
      console.error(error);
      // Handle different error scenarios
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your internet.');
      } else if (error.response) {
        toast.error(error.response.data.message || 'Upload failed');
      } else {
        toast.error('Unknown error. Try again later.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Title field */}
      <div className="cu-form-group">
        <label className="cu-label">{uploadType === 'track' ? 'Track Title' : 'Album Title'}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="cu-input"
          required
        />
      </div>

      {/* Description field */}
      <div className="cu-form-group">
        <label className="cu-label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          className="cu-textarea"
          required
        />
      </div>

      {/* Cover image file upload */}
      <div className="cu-form-group">
        <label className="cu-label">Cover Image</label>
        <div className="cu-file-upload" onClick={() => document.getElementById('coverImageInput').click()}>
          <input
            type="file"
            accept="image/*"
            id="coverImageInput"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <div className="cu-file-upload-text">Click to upload image</div>
          {coverImage && <div className="cu-file-selected">Selected: {coverImage.name}</div>}
        </div>
      </div>

      {/* Audio file upload for single track (Hide if we have AI data) */}
      {uploadType === 'track' ? (
        <div className="cu-form-group">
          <label className="cu-label">Audio Data</label>
          
          {prefillAiData ? (
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#ffb259' }}>✨ Using AI Generated Track</span>
              <button 
                type="button" 
                onClick={() => setPrefillAiData(null)}
                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="cu-file-upload" onClick={() => document.getElementById('audioFileInput').click()}>
              <input
                type="file"
                accept="audio/*"
                id="audioFileInput"
                onChange={handleAudioUpload}
                style={{ display: 'none' }}
              />
              <div className="cu-file-upload-text">Click to upload audio file</div>
              {audioFile && <div className="cu-file-selected">Selected: {audioFile.name}</div>}
            </div>
          )}
        </div>
      ) : (
        // Dynamic fields for uploading multiple album tracks
        <AlbumTrackFields albumTracks={albumTracks} setAlbumTracks={setAlbumTracks} />
      )}

      {/* Submit button */}
      <button type="submit" className="cu-submit-button" disabled={isUploading}>
        {isUploading
          ? `Uploading ${uploadType === 'track' ? 'Track' : 'Album'}...`
          : `Upload ${uploadType === 'track' ? 'Track' : 'Album'}`}
      </button>
    </form>
  );
};

export default UploadForm;
