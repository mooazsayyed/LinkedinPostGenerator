import React, { ReactNode, useState, useEffect } from 'react';
import { LinkedinIcon, Sparkles, LogIn, LogOut, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthForm } from './AuthForm';
import { supabase } from '../utils/supabaseClient';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showAuth, setShowAuth] = useState(false); // Controls AuthForm modal
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Hide AuthForm on successful login
  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  // Hide AuthForm on close
  const handleAuthClose = () => {
    setShowAuth(false);
  };

  // Handle profile dropdown toggle
  const handleProfileClick = () => {
    setShowProfile((prev) => !prev);
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
  };

  // Hide profile dropdown when clicking outside
  useEffect(() => {
    if (!showProfile) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfile]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100 via-purple-100 to-pink-100">
      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 relative w-full max-w-sm mx-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
              onClick={handleAuthClose}
              aria-label="Close"
            >
              &times;
            </button>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        </div>
      )}
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-100/20 py-4 sticky top-0 z-10"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LinkedinIcon className="h-7 w-7 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-800">LinkedIn Post Generator</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <ul className="flex space-x-6">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Examples
                  </a>
                </li>
              </ul>
              {/* Profile or Login Button */}
              {user ? (
                <div className="relative profile-dropdown">
                  <button
                    className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 focus:outline-none"
                    onClick={handleProfileClick}
                  >
                    <UserCircle className="h-7 w-7" />
                  </button>
                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
                      <div className="text-gray-700 text-sm mb-2">Signed in as</div>
                      <div className="font-semibold text-gray-900 break-all mb-4">{user.email}</div>
                      <button
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAuth(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </motion.button>
              )}
            </nav>
          </div>
        </div>
      </motion.header>
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-100/20 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
        >
          {children}
        </motion.div>
        {/* Features Section */}
        <section id="features" className="mt-16 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LinkedinIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">LinkedIn Optimized</h3>
              <p className="text-gray-600 text-sm">
                Generate posts specifically formatted for maximum engagement on LinkedIn's platform.
              </p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-purple-600"
                >
                  <path d="M12 5v14"></path>
                  <path d="M18 13l-6 6"></path>
                  <path d="M6 13l6 6"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Multiple Content Types</h3>
              <p className="text-gray-600 text-sm">
                Convert blog posts, articles, webpages, and videos into engaging LinkedIn content.
              </p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-pink-600"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Engagement Boosting</h3>
              <p className="text-gray-600 text-sm">
                Get tips and formatting that increase likes, comments, and shares on your posts.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="border-t border-gray-100/20 py-6 mt-auto bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} LinkedIn Post Generator
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;