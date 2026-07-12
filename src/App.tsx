import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import AppView from './pages/AppView/AppView';
import { CustomCursor } from './components/shared/CustomCursor';

export const App: React.FC = () => {
  return (
    <Router>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppView />} />
        {/* Catch-all: redirect any unknown hash route back to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
