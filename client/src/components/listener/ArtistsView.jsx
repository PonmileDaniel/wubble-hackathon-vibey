import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import './ArtistsView.css';

const apiSongUrl=import.meta.env.VITE_API_URL_SONG

const ArtistsView = ({ onTrackClick }) => {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistTracks, setArtistTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  

  // Fetch all artists
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiSongUrl}/get-Artists`);
        if (response.data.success) {
          setArtists(response.data.artists);
        } else {
          setError('Failed to fetch artists');
        }
      } catch (error) {
        setError('Error loading artists. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  // Handle artist selection
  const handleArtistClick = (artist) => {
    setSelectedArtist(artist);
    // Find tracks by this artist
    findTracksByArtist(artist.name);
  };

  // Find tracks by artist name
  const findTracksByArtist = async (artistName) => {
    try {
      setLoading(true);
      // We'll use the existing tracks endpoint but filter for this artist
      const response = await axios.get(`${apiSongUrl}/get-tracks`);
      if (response.data.success) {
        // Filter tracks by artist name
        const tracks = response.data.tracks.filter(
          track => track.artistName === artistName || track.artistId?.name === artistName
        );
        setArtistTracks(tracks);
      } else {
        setError('Failed to fetch artist tracks');
      }
    } catch (error) {
      setError('Error loading artist tracks');
    } finally {
      setLoading(false);
    }
  };

  // Back to artists list
  const handleBackClick = () => {
    setSelectedArtist(null);
    setArtistTracks([]);
  };

  // Show loading state
  if (loading && !selectedArtist) {
    return <div className="loading-state">Loading artists...</div>;
  }

  // Show error state
  if (error && !selectedArtist) {
    return <div className="error-state">{error}</div>;
  }

  // If we're viewing a specific artist
  if (selectedArtist) {
    return (
      <div className="artist-detail-view">
        <div className="artist-header">
          <button className="back-button" onClick={handleBackClick}>
            <ChevronLeft size={24} />
          </button>
          <h2 className="section-title">{selectedArtist.name}</h2>
        </div>
        
        <div className="artist-stats">
          <span>{selectedArtist.trackCount} tracks</span>
          <span>{selectedArtist.albumCount} albums</span>
        </div>
        
        {loading ? (
          <div className="loading-state">Loading tracks...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : artistTracks.length === 0 ? (
          <div className="empty-state">No tracks found for this artist</div>
        ) : (
          <div className="artist-tracks">
            <h3>Tracks</h3>
            <div className="artist-track-list">
              {artistTracks.map((track, index) => (
                <div 
                  key={`${track.trackName}-${index}`}
                  className="artist-track-item"
                  onClick={() => onTrackClick(track)}
                >
                  <div className="artist-track-number">{index + 1}</div>
                  <div className="artist-track-image">
                    <img 
                      src={track.imageUrl || 'https://via.placeholder.com/200'} 
                      alt={track.trackName} 
                    />
                  </div>
                  <div className="artist-track-info">
                    <h4 className="artist-track-title">{track.trackName}</h4>
                    <p className="artist-track-date">
                      {new Date(track.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render artists grid
  return (
    <div className="artists-view">
      <h2 className="section-title">Artists</h2>
      
      {artists.length === 0 ? (
        <div className="empty-state">No artists available</div>
      ) : (
        <div className="artists-grid">
          {artists.map((artist, index) => (
            <div 
              key={index}
              className="artist-card" 
              onClick={() => handleArtistClick(artist)}
            >
              <div className="artist-name">{artist.name}</div>
              <div className="artist-count">
                <span>{artist.trackCount} tracks</span>
                <span>{artist.albumCount} albums</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistsView;