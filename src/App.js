import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import ResidentPage from './pages/ResidentPage';
import RequireResident from './components/resident/RequireResident';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguageGate from './components/shared/LanguageGate';
import { PopupHost } from './components/shared/popup';
import TermsModal from './components/shared/TermsModal';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <LanguageGate />
      <PopupHost />
      <TermsModal />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin" element={<AdminPage />} />

            <Route path="/resident" element={<RequireResident><ResidentPage /></RequireResident>} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;