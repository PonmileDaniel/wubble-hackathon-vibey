import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './listener.css';
import './AlbumsView.css';
import ArtistsView from './ArtistsView';
import MusicPlayer from './MusicPlayer';
import { ChevronLeft } from 'lucide-react';


const apiSongUrl=import.meta.env.VITE_API_URL_SONG

const Listener = () => {
  // State declarations
  const [activeView, setActiveView] = useState('discover');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [popularTracks, setPopularTracks] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  
  // Album states
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsError, setAlbumsError] = useState(null);

  const navigate = useNavigate();

  // Helper function for creating unique track identifiers
  const getTrackIdentifier = (track, index) => {
    // Use a combination of trackName and artistName as a unique identifier
    return `${track.trackName}-${track.artistName || track.artistId?.name || 'unknown'}-${track._id || track.createdAt || index}`;
  };

  // Fetch tracks from the API
  const fetchTracks = async () => {
    try {
      const response = await axios.get(`${apiSongUrl}/get-tracks`);
      if (response.data.success) {
        setPopularTracks(response.data.tracks);
        setAllTracks(response.data.tracks);
      } else {
        console.error('Failed to fetch tracks:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  // Fetch all albums from API
  const fetchAlbums = async () => {
    try {
      setAlbumsLoading(true);
      const response = await axios.get(`${apiSongUrl}/get-albums`);
      if (response.data.success) {
        setAlbums(response.data.albums);
      } else {
        setAlbumsError('Failed to fetch albums');
      }
    } catch (error) {
      setAlbumsError('Error loading albums. Please try again later.', error);
    } finally {
      setAlbumsLoading(false);
    }
  };

  // Helper function to check if two tracks are the same
  const isSameTrack = (track1, track2) => {
    return track1 && track2 && 
      track1.trackName === track2.trackName && 
      (track1.artistName === track2.artistName || 
       track1.artistId?._id === track2.artistId?._id);
  };

  const handleTrackClick = (track) => {
    // First check if we're dealing with the same track using our helper function
    if (currentTrack && isSameTrack(currentTrack, track)) {
      // For the same track, just toggle play state
      setIsPlaying(!isPlaying);
      return;
    }
    
    // For a different track, update the currentTrack
    setCurrentTrack({...track});
    setIsPlaying(true);
  };

  // Check if a track is currently playing
  const isTrackPlaying = (track) => {
    return currentTrack && 
           currentTrack.trackName === track.trackName && 
           isPlaying;
  };

  // Handle album selection
  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
  };

  // Go back from album detail view to albums list
  const handleBackFromAlbum = () => {
    setSelectedAlbum(null);
  };

  // Initialize and fetch data
  useEffect(() => {
    // Initial data fetch when component mounts
    fetchTracks();
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for fetching albums when switching to albums view
  useEffect(() => {
    if (activeView === 'albums') {
      fetchAlbums();
    }
  }, [activeView]);

  // View rendering functions
  const renderDiscoverView = () => (
    <div className="discover-view">
      <section>
        <h2 className="section-title">Popular Tracks</h2>
        <div className="track-list">
          {popularTracks.map((track, index) => (
            <div
              key={getTrackIdentifier(track, index)}
              className={`track-item ${currentTrack && getTrackIdentifier(currentTrack) === getTrackIdentifier(track) ? 'active' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-index">{index + 1}</div>
              <div className="track-image">
                <img src={track.imageUrl || 'https://via.placeholder.com/200'} alt={track.trackName} />
              </div>
              <div className="track-info">
                <h3 className="track-title">{track.trackName}</h3>
                <p className="track-artist">{track.artistName || track.artistId?.name || 'Unknown Artist'}</p>
              </div>
              <div className="track-duration">{new Date(track.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderTracksView = () => (
    <div className="tracks-view">
      <h2 className="section-title">All Tracks</h2>
      <div className="track-list">
        {allTracks.map((track, index) => (
          <div
            key={getTrackIdentifier(track, index)}
            className={`track-item ${currentTrack && getTrackIdentifier(currentTrack) === getTrackIdentifier(track, index) ? 'active' : ''}`}
            onClick={() => handleTrackClick(track)}
          >
            <div className="track-index">{index + 1}</div>
            <div className="track-image">
              <img src={track.imageUrl || 'https://via.placeholder.com/200'} alt={track.trackName} />
            </div>
            <div className="track-info">
              <h3 className="track-title">{track.trackName}</h3>
              <p className="track-artist">{track.artistName || track.artistId?.name || 'Unknown Artist'}</p>
            </div>
            <div className="track-duration">{new Date(track.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render the albums grid view
  const renderAlbumsGrid = () => (
    <div className="albums-grid">
      {albums.map((album) => (
        <div 
          key={album._id} 
          className="album-card" 
          onClick={() => handleAlbumClick(album)}
        >
          <div className="album-image-container">
            <img 
              src={album.imageUrl || 'https://via.placeholder.com/300'} 
              alt={album.albumName} 
              className="album-image"
            />
          </div>
          <div className="album-info">
            <h3 className="album-title">{album.albumName}</h3>
            <p className="album-artist">{album.artistId?.name || 'Unknown Artist'}</p>
            <p className="album-tracks">{album.tracks?.length || 0} tracks</p>
          </div>
        </div>
      ))}
    </div>
  );

  // Render detailed view of a selected album with its tracks
  const renderAlbumDetail = () => {
    if (!selectedAlbum) return null;
    
    return (
      <div className="album-detail">
        <div className="album-detail-header">
          <button className="back-button" onClick={handleBackFromAlbum}>
            <ChevronLeft size={24} />
          </button>
          <div className="album-detail-info">
            <div className="album-detail-image-container">
              <img 
                src={selectedAlbum.imageUrl || 'https://via.placeholder.com/300'} 
                alt={selectedAlbum.albumName} 
                className="album-detail-image"
              />
            </div>
            <div className="album-detail-text">
              <h2 className="album-detail-title">{selectedAlbum.albumName}</h2>
              <p className="album-detail-artist">{selectedAlbum.artistId?.name || 'Unknown Artist'}</p>
              <p className="album-detail-desc">{selectedAlbum.description}</p>
              <p className="album-detail-count">
                {selectedAlbum.tracks?.length || 0} tracks • 
                {new Date(selectedAlbum.createdAt).getFullYear()}
              </p>
            </div>
          </div>
        </div>

        <div className="album-tracks-list">
          <h3 className="tracks-title">Tracks</h3>
          {selectedAlbum.tracks && selectedAlbum.tracks.length > 0 ? (
            <div className="tracks-container">
              {selectedAlbum.tracks.map((track, index) => (
                <div 
                  key={track._id || index} 
                  className={`track-item ${currentTrack && currentTrack._id === track._id ? 'active' : ''}`}
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="track-number">{index + 1}</div>
                  <div className="track-image">
                    <img 
                      src={selectedAlbum.imageUrl || 'https://via.placeholder.com/80'} 
                      alt={track.trackName} 
                    />
                    <div className="play-indicator">
                      {isTrackPlaying(track) ? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg> : 
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>}
                    </div>
                  </div>
                  <div className="track-info">
                    <h4 className="track-name">{track.trackName}</h4>
                    <p className="track-duration">{track.duration || '0:00'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-tracks-message">No tracks available in this album</p>
          )}
        </div>
      </div>
    );
  };

  // Render the albums view with loading and error states
  const renderAlbumsView = () => {
    // Show loading state
    if (albumsLoading) {
      return <div className="loading-state">Loading albums...</div>;
    }

    // Show error state
    if (albumsError) {
      return <div className="error-state">{albumsError}</div>;
    }

    // Render either album grid or album detail based on selection
    return (
      <div className="albums-view">
        <h2 className="section-title">Albums</h2>
        {selectedAlbum ? renderAlbumDetail() : renderAlbumsGrid()}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'discover':
        return renderDiscoverView();
      case 'tracks':
        return renderTracksView();
      case 'albums':
        return renderAlbumsView();
      // case 'artists':
      //   return <ArtistsView onTrackClick={handleTrackClick}/>;
      default:
        return renderDiscoverView();
    }
  };

  // Main component render
  return (
    <div className="music-browser">
      <header className="header">
        <div className="header-top">
          <div className="logo">Vibey</div>
          <button
            className="upload-button"
            onClick={() => navigate('/upload')}
          >
            Upload
          </button>
        </div>
        <nav className="nav">
          <ul>
            <li
              className={activeView === 'discover' ? 'active' : ''}
              onClick={() => setActiveView('discover')}
            >
              Discover
            </li>
            <li
              className={activeView === 'tracks' ? 'active' : ''}
              onClick={() => setActiveView('tracks')}
            >
              Tracks
            </li>
            <li
              className={activeView === 'albums' ? 'active' : ''}
              onClick={() => setActiveView('albums')}
            >
              Albums
            </li>
            <li
              className={activeView === 'artists' ? 'active' : ''}
              onClick={() => setActiveView('artists')}
            >
              Artists
            </li>
          </ul>
        </nav>
      </header>

      <main className="main-content">{renderContent()}</main>

      <MusicPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        allTracks={allTracks}
        onTrackChange={setCurrentTrack}
      />
    </div>
  );
};

export default Listener;