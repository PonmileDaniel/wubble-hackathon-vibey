import React, { useState, useEffect } from 'react';
import './CreatorUpload.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import AlbumTrackFields from './AlbumTrackFields';
import UploadForm from './UploadForm';
import AiGenerator from './AiGenerator';
import { Trash2, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const apiSongUrl=import.meta.env.VITE_API_URL_SONG

/**
 * CreatorUpload Component
 * Manages the artist studio interface, including AI generation,
 * uploading tracks/albums, and viewing published content.
 */
const CreatorUpload = () => {
  const [uploadType, setUploadType] = useState('track');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [myTracks, setMyTracks] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTrackIds, setDeleteTrackIds] = useState([]);
  const [prefillAiData, setPrefillAiData] = useState(null);

  /**
   * Transitions from the AI Studio to the upload form, prefilling AI-generated data.
   * @param {Object} trackData - The generated track details (title, url).
   */
  const handlePublishAiTrack = (trackData) => {
    setPrefillAiData(trackData);
    setUploadType('track');
  };

  /**
   * Removes a published track from the platform.
   * @param {string} trackId - The unique identifier of the track.
   */
  const handleDeleteTrack = async (trackId) => {
    try {
      setDeleteTrackIds(prev => [...prev, trackId]);

      await axios.delete(`${apiSongUrl}/delete-track/${trackId}`, {
        withCredentials: true,
      });

      setMyTracks(prev => prev.filter(track => track._id !== trackId));
      toast.success('Track deleted Successfully')
    } catch (error) {
      toast.error('Failed to delete track');
      console.error(error);
    } finally {
      setDeleteTrackIds(prev => prev.filter(id => id !== trackId));
    }
  };

  /**
   * Fetches the creator's published tracks and albums from the server.
   */
  const fetchUploadedData = async () => {
      setIsLoading(true);
      try {
        const config = {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data', timeout: 15000 },
        };

        const trackRes = await axios.get(`${apiSongUrl}/get-artist-track`, config);
        setMyTracks(trackRes.data.tracks || []);

        const albumRes = await axios.get(`${apiSongUrl}/get-artist-album`, config);
        setMyAlbums(albumRes.data.albums || []);

      } catch (error) {
        toast.error('Failed to load your tracks and albums', error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchUploadedData();
  }, []);

  return (
    <div className="cu-page">
      <div className="cu-container">
        <div className="cu-header">
          <div className="cu-subtitle"><h2>Share your AI-generated creations with the world</h2></div>
        </div>

        <div className="cu-upload-container">
          
          <div className="cu-nav-dropdown">
            <div className="cu-nav-header" onClick={() => setIsNavOpen(!isNavOpen)}>
              <span>Navigation: <strong>
                {uploadType === 'track' ? 'Single Track'
                  : uploadType === 'album' ? 'Album'
                  : uploadType === 'ai-generate' ? '✨ AI Studio'
                  : uploadType === 'my-tracks' ? 'My Tracks'
                  : 'My Albums'}
              </strong></span>
              {isNavOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {isNavOpen && (
              <div className="cu-toggle-container-vertical">
                {['track', 'album', 'ai-generate', 'my-tracks', 'my-albums'].map((type) => (
                  <div
                    key={type}
                    className={`cu-toggle-button ${uploadType === type ? 'active' : ''}`}
                    onClick={() => {
                      setUploadType(type);
                      setIsNavOpen(false);
                    }}
                  >
                    {type === 'track' ? 'Single Track'
                      : type === 'album' ? 'Album'
                      : type === 'ai-generate' ? '✨ AI Studio'
                      : type === 'my-tracks' ? 'My Tracks'
                      : 'My Albums'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploadType === 'track' || uploadType === 'album' ? (
            <UploadForm 
              uploadType={uploadType} 
              prefillAiData={prefillAiData} 
              setPrefillAiData={setPrefillAiData} 
            />
          ) : uploadType === 'ai-generate' ? (
            <AiGenerator onPublish={handlePublishAiTrack} />
          ) : (
            <div className="cu-board">
              {isLoading ? (
                <div style={{ textAlign: 'center', color: 'white', padding: '20px' }}>
                  <RefreshCw size={24} className="rotating" style={{ marginBottom: '10px' }} />
                  <p>Loading your music...</p>
                </div>
              ) : (
                <>
                  {uploadType === 'my-tracks' && (
                    <div className="cu-my-tracks">
                      <h3>My Tracks</h3>
                      <ul>
                        {myTracks.length > 0 ? (
                          myTracks.map((track) => (
                            <li key={track._id}>
                              <div>{track.trackName}</div>
                              <div className='cu-track-control'>
                              <audio controls preload="auto">
                                <source src={track.audioUrl} type="audio/mp3" />
                                Your browser does not support the audio element.
                              </audio>
                              <button 
                              className={`delete-button ${deleteTrackIds.includes(track._id) ? 'deleting' : ''}`} 
                              onClick={() => handleDeleteTrack(track._id, track.trackName)}
                              disabled={deleteTrackIds.includes(track._id)}
                              >
                                {deleteTrackIds.includes(track._id) ? (
                                  <RefreshCw size={20} className="rotating" />
                                ) : (
                                  <Trash2 size={20} color="red" />
                                )}
                              </button>
                              </div>
                            </li>
                          ))
                        ) : (
                          <div>No tracks available</div>
                        )}
                      </ul>
                    </div>
                  )}

                  {uploadType === 'my-albums' && (
                    <div className="cu-my-albums">
                      <h3>My Albums</h3>
                      <ul className="album-list">
                        {myAlbums.map((album) => (
                          <li key={album._id} style={{ listStyle: 'none' }}>
                            <div className="album-item">
                              {album.imageUrl && (
                                <img src={album.imageUrl} className="album-cover" />
                              )}
                              <div className="album-info">
                                <h4>{album.albumName}</h4>
                                {album.tracks && <p>{album.tracks.length} Tracks</p>}
                                {album.createdAt && (
                                  <p className="album-date">
                                    {new Date(album.createdAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorUpload;
