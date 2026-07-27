import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import ResidentPage from './pages/ResidentPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ResidentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          
          <Route path="/resident" element={<ResidentPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;