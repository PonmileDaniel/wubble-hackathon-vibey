import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./landingpage.css";


const LandingPage = () => {
  const navigate = useNavigate();
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="landing-page"
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(106, 17, 203, 0.8), rgba(37, 117, 252, 1))`,
      }}
    >
      <div className="background-overlay"></div>
      <div className="landing-content">
        <div className="logo-section">
          <h1 className="logo-title">Vibey</h1>
          <p className="logo-subtitle">Discover AI-Generated Music</p>
        </div>

        <div className="auth-container">
          <button className="auth-button" onClick={() => navigate('/listener')}>Continue as Listener</button>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          <button className="auth-button" onClick={() => navigate('/login')}>Continue as Creator</button>
        </div>

        <div className="footer">
          <p>© 2025 Vibey. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
