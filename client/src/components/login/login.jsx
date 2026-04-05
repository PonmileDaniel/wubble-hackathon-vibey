import React, { useState } from 'react';
import { Music2,Mail, Lock } from 'lucide-react';
import AnimatedBackground from '../animationback/background'; 
import './login.css';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true)

    try {
      const res = await loginUser({ email, password });
      const { success, message, wubbleApiKey } = res.data; // Destructure wubbleApiKey here

      if (success) {
        toast.success('🎉 Login successfully!');
        setEmail('');
        setPassword('');
        // Add this line to save the API key:
        localStorage.setItem('wubbleApiKey', wubbleApiKey); 
        localStorage.setItem('creatorToken', res.data.token);
        navigate('/upload')
      } else {
        toast.error( message || 'Login failed.')
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong.')
    } finally{
      setLoading(false);
    }
   
  };

  return (
    <AnimatedBackground>
      <div className="creator-container">
        <div className="creator-header">
          <Music2 size={42} color="white" style={{ marginBottom: '10px' }} />
          <div className="creator-title">Creator Login</div>
          <div className="creator-subtitle">Access your Vibey creator account</div>
        </div>

        <form className="creator-form" onSubmit={handleLogin}>
          <div className="creator-input-wrappe">
            <label className="creator-label">Email</label>
            {/* <Mail className="creator-input-ico" size={18} /> */}
            <input
              type="email"
              placeholder="your.email@example.com"
              className="creator-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="creator-input-wrappe" >
            <label className="creator-label">Password</label>
            {/* <Lock className="creator-input-ico" size={18} /> */}
            <input
              type="password"
              placeholder="password"
              className="creator-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="creator-forgot-password">
            Forgot password?
          </div>

          <button type="submit" className="creator-button" disabled={loading}>
            {loading ? 'Calm down...' : 'Login'}
          </button>
        </form>

        <div className="creator-login-section">
          Don't have a creator account yet?{' '}
          <Link to="/signup" className="creator-login-link">Sign Up</Link>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default Login;
