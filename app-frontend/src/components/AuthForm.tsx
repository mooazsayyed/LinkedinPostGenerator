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
  const [imageError, setImageError] = useState(false);

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
        console.log('User signed in:', session.user); // Debug log
        console.log('User metadata:', session.user.user_metadata); // Debug log
        upsertProfilePicture(session.user);
        if (onSuccess) onSuccess();
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setLinkedinLoading(false);
        setImageError(false); // Reset image error on sign out
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
          redirectTo: window.location.origin,
          scopes: 'openid profile email'
        }
      });

      if (error) {
        setError(error.message);
        setLinkedinLoading(false);
      }
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

  const handleImageError = () => {
    setImageError(true);
  };

  const getProfilePicture = () => {
    // Try multiple sources for profile picture
    const sources = [
      user?.user_metadata?.avatar_url,
      user?.user_metadata?.picture,
      user?.user_metadata?.profile_pic_url
    ].filter(Boolean);

    return sources[0] || null;
  };

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  const getProviderName = () => {
    const provider = user?.app_metadata?.provider;
    if (provider === 'linkedin_oidc') return 'LinkedIn';
    if (provider) return provider.replace('_', ' ');
    return 'Email';
  };

  const upsertProfilePicture = async (user) => {
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.profile_pic_url ||
      null;

    if (!avatarUrl) return;

    // Upsert into your 'profiles' table
    await supabase
      .from('profiles')
      .upsert([
        { id: user.id, avatar_url: avatarUrl }
      ]);
  };

  if (user) {
    const profilePicture = getProfilePicture();
    const displayName = getDisplayName();
    const providerName = getProviderName();

    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="flex items-center space-x-3">
          {profilePicture && !imageError ? (
            <div className="relative">
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                onError={handleImageError}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              {/* Loading indicator overlay while image loads */}
              <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse opacity-0"></div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <div className="text-gray-800 font-semibold">
              {displayName}
            </div>
            <div className="text-sm text-gray-600">{user.email}</div>
            <div className="text-xs text-gray-400 capitalize">
              via {providerName}
            </div>
          </div>
        </div>
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-500 max-w-sm">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify({
                provider: user?.app_metadata?.provider,
                avatar_url: user?.user_metadata?.avatar_url,
                picture: user?.user_metadata?.picture,
                full_name: user?.user_metadata?.full_name,
                name: user?.user_metadata?.name,
              }, null, 2)}
            </pre>
          </details>
        )}
        
        <button
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
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




const fetchLinkedInProfile = async (accessToken: string) => {
  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch LinkedIn profile');

    const data = await res.json();
    return data?.picture || null;
  } catch (err) {
    console.error('Error fetching LinkedIn profile:', err);
    return null;
  }
};

const LinkedInProfile = () => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const loadLinkedInProfilePic = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (error || !session) {
        console.log('No session or error:', error);
        return;
      }

      const provider = session.user?.app_metadata?.provider;
      const accessToken = session.provider_token;

      if (provider === 'linkedin' && accessToken) {
        const pic = await fetchLinkedInProfile(accessToken);
        if (pic) {
          setProfilePicture(pic);

          // Optional: Update profile in Supabase DB
          await supabase
            .from('profiles')
            .update({ avatar_url: pic })
            .eq('id', session.user.id);
        }
      }
    };

    loadLinkedInProfilePic();
  }, []);

  return (
    <div>
      {profilePicture ? (
        <img
          src={profilePicture}
          alt="LinkedIn Profile"
          className="w-20 h-20 rounded-full"
        />
      ) : (
        <p>Loading profile picture...</p>
      )}
    </div>
  );
};

export default LinkedInProfile;
