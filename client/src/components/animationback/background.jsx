import React, { useEffect, useState } from 'react';
import './background.css'; // This holds the shared styles

const AnimatedBackground = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="landing-page"
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(106, 17, 203, 0.8), rgba(37, 117, 252, 1))`,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedBackground;
