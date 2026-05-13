import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components (We'll create these)
import Home from './pages/Home';
import Admin from './pages/Admin';
import Recruitment from './pages/Recruitment';
import NambaGuide from './pages/NambaGuide';
import PropertyDetail from './pages/PropertyDetail';

export default function App() {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-electric-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home isAdmin={false} />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/namba-guide" element={<NambaGuide />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}


