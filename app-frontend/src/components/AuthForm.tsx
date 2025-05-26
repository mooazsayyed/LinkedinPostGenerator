import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const SESSION_LENGTH_DAYS = 7;

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      setUser(data.session?.user || null);
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      // Handle successful OAuth login
      if (event === 'SIGNED_IN' && session?.user) {
        setLinkedinLoading(false);
        if (onSuccess) onSuccess();
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setLinkedinLoading(false);
      }
    });
    
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [onSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) setError(error.message);
    setLoading(false);
    if (!error && onSuccess) onSuccess();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('Signup successful! Please check your email to confirm your account.');
      setMode('login');
    }
    setLoading(false);
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: window.location.origin, // Redirects back to your current page (localhost:5173 in dev)
          scopes: 'openid profile email'
        }
      });

      if (error) {
        setError(error.message);
        setLinkedinLoading(false);
      }
      // Loading state will be handled by onAuthStateChange
    } catch (error) {
      console.error('LinkedIn sign-in error:', error);
      setError('Failed to sign in with LinkedIn');
      setLinkedinLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg('');
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) {
      setResetMsg('Error: ' + error.message);
    } else {
      setResetMsg('Password reset email sent! Please check your inbox.');
    }
    setResetLoading(false);
  };

  if (user) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="flex items-center space-x-3">
          {user.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="text-gray-700">
              <b>{user.user_metadata?.full_name || user.email}</b>
            </div>
            {user.user_metadata?.full_name && (
              <div className="text-sm text-gray-500">{user.email}</div>
            )}
            {user.app_metadata?.provider && (
              <div className="text-xs text-gray-400 capitalize">
                via {user.app_metadata.provider.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4 p-4 max-w-xs mx-auto">
        <h2 className="text-xl font-semibold text-center">Reset Password</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={resetEmail}
          onChange={e => setResetEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          required
        />
        {resetMsg && <div className={resetMsg.startsWith('Error') ? 'text-red-500 text-sm' : 'text-green-600 text-sm'}>{resetMsg}</div>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={resetLoading}
        >
          {resetLoading ? 'Sending...' : 'Send Reset Email'}
        </button>
        <div className="text-center text-sm text-gray-600">
          <button type="button" className="text-blue-600 hover:underline" onClick={() => { setMode('login'); setResetMsg(''); }}>
            Back to Login
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-xs mx-auto">
      <h2 className="text-xl font-semibold text-center">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      
      {/* LinkedIn Sign-in Button */}
      <button
        type="button"
        onClick={handleLinkedInSignIn}
        disabled={linkedinLoading || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded hover:bg-[#005885] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {linkedinLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )}
        {linkedinLoading ? 'Connecting...' : 'Continue with LinkedIn'}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {successMsg && <div className="text-green-600 text-sm">{successMsg}</div>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || linkedinLoading}
        >
          {loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : (mode === 'login' ? 'Login' : 'Sign Up')}
        </button>
      </form>

      {/* Footer Links */}
      <div className="flex flex-col items-center gap-1 text-center text-sm text-gray-600">
        {mode === 'login' ? (
          <>
            <button type="button" className="text-blue-600 hover:underline mb-1" onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}>
              Forgot password?
            </button>
            <span>
              Don't have an account?{' '}
              <button type="button" className="text-blue-600 hover:underline" onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}>
                Sign Up
              </button>
            </span>
          </>
        ) : (
          <>
            <span>
              Already have an account?{' '}
              <button type="button" className="text-blue-600 hover:underline" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}>
                Login
              </button>
            </span>
          </>
        )}
      </div>
    </div>
  );
};