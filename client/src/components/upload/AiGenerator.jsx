import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusCircle, Clock, Menu, X, Music, UploadCloud } from 'lucide-react';
import './CreatorUpload.css';

const apiUrl = import.meta.env.VITE_API_URL;

// Accept the onPublish prop passed from CreatorUpload
const AiGenerator = ({ onPublish }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pollingStatus, setPollingStatus] = useState('');
  
  const [sessions, setSessions] = useState([]);
  const [projectId, setProjectId] = useState(null); 
  const [currentHistory, setCurrentHistory] = useState([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch past sessions on load
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/ai/sessions`, { withCredentials: true });
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (error) {
      console.error("Failed to load sessions",error);
    }
  };

  const handleStartNew = () => {
    setProjectId(null);
    setCurrentHistory([]);
    // setGeneratedData(null);
    setPrompt('');
    setIsSidebarOpen(false); // Close sidebar
  };

  const handleSelectSession = (session) => {
    setProjectId(session.projectId);
    setCurrentHistory(session.history);
    setPrompt('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt) return toast.error('Please enter a prompt!');
    
    setIsGenerating(true);
    setPollingStatus('Sending prompt to AI Studio...');
  

    try {
      const chatRes = await axios.post(
        `${apiUrl}/api/ai/generate`, 
        { prompt, projectId },
        { withCredentials: true }
      );

      const { requestId, projectId: newProjectId } = chatRes.data;
      setProjectId(newProjectId);
      setPollingStatus('AI is cooking... This takes about 1-3 minutes.');

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await axios.get(
            `${apiUrl}/api/ai/status/${requestId}`,
            { withCredentials: true }
          );

          const statusData = pollRes.data.data;

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            
            const newAudioData = {
              title: statusData.song_title || 'AI Generated Track',
              audioUrl: statusData.streaming?.final_audio_url
            };
            setCurrentHistory(prevHistory => [...prevHistory, { 
                prompt, 
                audioUrl: newAudioData.audioUrl 
            }]);
            
            setIsGenerating(false);
            setPrompt('');
            toast.success('Your AI track is ready!');
            fetchSessions(); // Refresh sidebar
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            toast.error(`AI failed: ${statusData.error_message || "Unknown error."}`);
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 15000); 

    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      toast.error(error.response?.data?.message || 'Failed to initiate AI generation.');
    }
  };

  return (
    <div className="ai-studio-container">
      
      {/* Top Header with Hamburger */}
      <div className="ai-header">
        <button onClick={() => setIsSidebarOpen(true)} className="ai-menu-btn">
          <Menu size={24} />
        </button>
        <span className="cu-welcome ai-welcome-text">
          {projectId ? 'Continuation Studio' : '✨ New AI Music Session'}
        </span>
      </div>

      {/* Pop-out Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="ai-sidebar-overlay">
          <div className="ai-sidebar-panel">
            <div className="ai-sidebar-header">
              <h3 className="ai-sidebar-title">Your Sessions</h3>
              <button className="ai-close-btn" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <button onClick={handleStartNew} className="cu-submit-button ai-new-session-btn">
              <PlusCircle size={16}/> Create New Session
            </button>
            
            <div className="ai-sessions-list">
              {sessions.length === 0 ? (
                 <p className="ai-empty-text">No past sessions found.</p>
              ) : (
                sessions.map(s => (
                  <div 
                    key={s._id} 
                    onClick={() => handleSelectSession(s)}
                    className={`ai-session-item ${projectId === s.projectId ? 'active' : ''}`}
                  >
                    <Music className="ai-session-icon" size={16} color="#ffb259" />
                    <div className="ai-session-info">
                      <p className="ai-session-name">{s.title}</p>
                      <span className="ai-session-date">{new Date(s.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Click outside to close */}
          <div className="ai-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      {/* History Area */}
      {currentHistory.length > 0 && (
        <div className="ai-history-area">
          <h4 className="ai-history-header"><Clock size={16}/> Chat History</h4>
          {currentHistory.map((item, idx) => (
            <div key={idx} className="ai-history-item">
              <p className="ai-prompt-text">💬 "{item.prompt}"</p>
              {item.audioUrl ? (
                <div className="ai-audio-container">
                  <audio controls src={item.audioUrl} className="ai-audio-player" />
                  <button 
                    type="button"
                    onClick={() => onPublish({ title: item.prompt.substring(0, 50), url: item.audioUrl })}
                    className="cu-submit-button ai-publish-btn" 
                  >
                    <UploadCloud size={14} /> Publish to Tracks
                  </button>
                </div>
              ) : (
                <span className="ai-unavailable-text">Audio unavailable</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleGenerate}>
        <div className="cu-form-group">
          <label className="cu-label">{projectId ? 'Prompt AI to refine/continue this session' : 'What kind of music do you want to create?'}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={projectId ? "e.g., Make it acoustic, or add a heavy bass drop..." : "e.g., A fast-paced synthwave track about coding all night..."}
            className="cu-textarea"
            disabled={isGenerating}
            required
          />
        </div>
        <button type="submit" className="cu-submit-button" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate AI Track'}
        </button>
      </form>

      {/* Progress Indicator */}
      {isGenerating && (
        <div className="ai-progress-text">
          <p>⏳ {pollingStatus}</p>
        </div>
      )}
    </div>
  );
};

export default AiGenerator;