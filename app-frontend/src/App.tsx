import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LinkedInPostGenerator } from './components/LinkedInPostGenerator';
import { PrivacyPolicy } from './components/PrivacyPolicy';
// import { LinkedInCallback } from './components/LinkedInCallback';
import { LoginOptions } from './components/LoginOptions';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LinkedInPostGenerator />} />
          <Route path="/login" element={<LoginOptions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
