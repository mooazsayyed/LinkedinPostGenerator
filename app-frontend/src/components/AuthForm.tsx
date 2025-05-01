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
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
        <div className="text-gray-700">Logged in as <b>{user.email}</b></div>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
    <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4 p-4 max-w-xs mx-auto">
      <h2 className="text-xl font-semibold text-center">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
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
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : (mode === 'login' ? 'Login' : 'Sign Up')}
      </button>
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
    </form>
  );
}; 