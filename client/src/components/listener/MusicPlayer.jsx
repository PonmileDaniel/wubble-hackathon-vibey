import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle
} from 'lucide-react';

const MusicPlayer = ({ currentTrack, isPlaying, setIsPlaying, allTracks, onTrackChange }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  
  const audioRef = useRef(new Audio());

  // Helper function for getting track identifiers
  const getTrackIdentifier = (track, index) => {
    if (!track) return null;
    return `${track.trackName}-${track.artistName || track.artistId?.name || 'unknown'}-${track._id || track.createdAt || index}`;
  };

  // Volume control functions
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  // Track navigation functions
  const playPrevious = () => {
    if (currentTrack) {
      const currentIdentifier = getTrackIdentifier(currentTrack);
      const currentIndex = allTracks.findIndex(track => getTrackIdentifier(track) === currentIdentifier);
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : allTracks.length - 1;
      onTrackChange(allTracks[previousIndex]);
    }
  };
  
  const playNext = () => {
    if (currentTrack) {
      const currentIdentifier = getTrackIdentifier(currentTrack);
      const currentIndex = allTracks.findIndex(track => getTrackIdentifier(track) === currentIdentifier);
      const nextIndex = currentIndex < allTracks.length - 1 ? currentIndex + 1 : 0;
      onTrackChange(allTracks[nextIndex]);
    }
  };
  
  // Player mode functions
  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
  };
  
  const toggleRepeat = () => {
    setIsRepeating(!isRepeating);
  };

  // Helper functions for UI
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Audio cleanup - only when component unmounts
  useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, []);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeating) {
        audio.currentTime = 0;
        audio.play();
      } else if (isShuffling) {
        const randomIndex = Math.floor(Math.random() * allTracks.length);
        onTrackChange(allTracks[randomIndex]);
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isRepeating, isShuffling, allTracks]);

  // Update audio source when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      const audio = audioRef.current;
      
      // Pause current playback
      audio.pause();
      
      // Update audio source
      audio.src = currentTrack.audioUrl;
      
      // Load the new audio
      audio.load();
      
      // If isPlaying is true, play the audio
      if (isPlaying) {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing track:", error);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      // If we should be playing, try to play
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    } else {
      // Otherwise pause
      audio.pause();
    }
  }, [isPlaying]);

  // Don't render anything if there's no current track
  if (!currentTrack) return null;

  return (
    <footer className={`player-bar visible`}>
      <div className="player-container">
        <div className="player-track-info">
          <div className="player-track-image">
            <img src={currentTrack.imageUrl || 'https://via.placeholder.com/200'} alt={currentTrack.trackName} />
          </div>
          <div className="player-track-details">
            <h4>{currentTrack.trackName}</h4>
            <p>{currentTrack.artistName || currentTrack.artistId?.name || 'Unknown Artist'}</p>
          </div>
        </div>
        <div className="player-controls">
          <div className="control-buttons">
            <button 
              className={`control-button ${isShuffling ? 'active' : ''}`}
              onClick={toggleShuffle}
            >
              <Shuffle size={20} />
            </button>
            <button 
              className="control-button"
              onClick={playPrevious}
            >
              <SkipBack size={24} />
            </button>
            <button 
              className="play-pause-button"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button 
              className="control-button"
              onClick={playNext}
            >
              <SkipForward size={24} />
            </button>
            <button 
              className={`control-button ${isRepeating ? 'active' : ''}`}
              onClick={toggleRepeat}
            >
              <Repeat size={20} />
            </button>
          </div>
          <div className="audio-controls">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        <div className="volume-controls">
          <button 
            className="control-button"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </footer>
  );
};

export default MusicPlayer;