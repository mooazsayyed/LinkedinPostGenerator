import React from 'react';
import { Layout } from './components/Layout';
import { LinkedInPostGenerator } from './components/LinkedInPostGenerator'; 

const App: React.FC = () => {
  return (
    <Layout>
      <LinkedInPostGenerator />  {/* This component will now handle everything */}
    </Layout>
  );
};

export default App;
