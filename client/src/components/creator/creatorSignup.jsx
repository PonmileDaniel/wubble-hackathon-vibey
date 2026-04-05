import React, { useState } from 'react';
import { Music2, User, Mail, Lock } from 'lucide-react';
import './creatorSIgnup.css';
import { registerUser } from '../api/auth';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../animationback/background';

const CreatorSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await registerUser({ name, email, password });
      const { success, message } = res.data;

      if (success) {
        toast.success('🎉 Account created successfully!');
        setName('');
        setEmail('');
        setPassword('');
        navigate('/login')
      } else {
        toast.error(message || 'Signup failed.');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="creator-landing-page">
        <div className="creator-container">
          <div className="creator-header">
            <Music2 size={44} color="white" style={{ marginBottom: '10px' }} />
            <div className="creator-title">Join Vibey as a Creator</div>
            <div className="creator-subtitle">Unleash your AI-powered music</div>
          </div>

          <form className="creator-form" onSubmit={handleSignup}>
            <div className="creator-input-wrapper">
              {/* <User className="creator-input-icon" size={18} /> */}
              <input
                type="text"
                placeholder="Artist Name"
                className="creator-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="creator-input-wrapper">
              {/* <Mail className="creator-input-icon" size={18} /> */}
              <input
                type="email"
                placeholder="you@example.com"
                className="creator-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="creator-input-wrapper">
              {/* <Lock className="creator-input-icon" size={18} /> */}
              <input
                type="password"
                placeholder="Create a secure password"
                className="creator-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="creator-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="creator-login-section">
            Already have an account?{' '}
            <Link to="/login" className="creator-login-link">Log In</Link>

          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default CreatorSignup;
