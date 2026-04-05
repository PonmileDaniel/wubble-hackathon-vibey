import React from 'react';

const AlbumTrackFields = ({ albumTracks, setAlbumTracks }) => {
  const addTrack = () => {
    if (albumTracks.length < 10) {
      const newId = Math.max(...albumTracks.map(t => t.id)) + 1;
      setAlbumTracks([...albumTracks, { id: newId, title: '', audioFile: null }]);
    }
  };

  const removeTrack = (id) => {
    if (albumTracks.length > 1) {
      setAlbumTracks(albumTracks.filter(track => track.id !== id));
    }
  };

  const handleTitleChange = (e, id) => {
    setAlbumTracks(albumTracks.map(track => track.id === id ? { ...track, title: e.target.value } : track));
  };

  const handleFileChange = (e, id) => {
    if (e.target.files?.[0]) {
      setAlbumTracks(albumTracks.map(track => track.id === id ? { ...track, audioFile: e.target.files[0] } : track));
    }
  };

  return (
    <>
      <label className="cu-label">Album Tracks (Up to 10)</label>
      {albumTracks.map((track, index) => (
        <div className="cu-track" key={track.id}>
          <div className="cu-track-header">
            <div className="cu-track-number">Track {index + 1}</div>
            {albumTracks.length > 1 && (
              <button type="button" className="cu-remove-button" onClick={() => removeTrack(track.id)}>Remove</button>
            )}
          </div>
          <div className="cu-form-group">
            <input
              type="text"
              placeholder="Track title"
              className="cu-input"
              value={track.title}
              onChange={(e) => handleTitleChange(e, track.id)}
              required
            />
          </div>
          <div className="cu-file-upload" onClick={() => document.getElementById(`audioFile_${track.id}`).click()}>
            <input
              id={`audioFile_${track.id}`}
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileChange(e, track.id)}
              style={{ display: 'none' }}
            />
            <div className="cu-file-upload-text">Click to upload audio file</div>
            {track.audioFile && <div className="cu-file-selected">Selected: {track.audioFile.name}</div>}
          </div>
        </div>
      ))}
      {albumTracks.length < 10 && (
        <button type="button" className="cu-add-track" onClick={addTrack}>+ Add Track</button>
      )}
    </>
  );
};

export default AlbumTrackFields;
