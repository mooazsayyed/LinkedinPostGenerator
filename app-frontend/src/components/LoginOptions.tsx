import React from 'react';
import { LinkedInLogin } from './LinkedInLogin';
import { LINKEDIN_CONFIG } from '../config/linkedin';

export const LoginOptions: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        <div className="space-y-4">
          <LinkedInLogin
            clientId={LINKEDIN_CONFIG.clientId}
            redirectUri={LINKEDIN_CONFIG.redirectUri}
            onSuccess={() => console.log('Login successful')}
            onFailure={(error) => console.error('Login failed:', error)}
          />
        </div>
      </div>
    </div>
  );
}; 