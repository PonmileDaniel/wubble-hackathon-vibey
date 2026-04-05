import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectRoute from './components/auth/ProtectRoute';
import CreatorUpload from './components/upload/CreatorUpload';
import Listener from './components/listener/listener';

import CreatorSignup from "./components/creator/creatorSignup";
import Login from "./components/login/login";
import LandingPage from './components/LandingPage/landingpage';

function App() {
  return (
    <>
    {/* <CreatorUpload/> */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/listener" element={<Listener />} />
        <Route path="/signup" element={<CreatorSignup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={
          <ProtectRoute>
            <CreatorUpload/>
          </ProtectRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
