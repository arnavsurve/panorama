import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegistrationPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  // API URLs
  const API_BASE_URL = 'http://localhost:8000';
  const REGISTER_URL = `${API_BASE_URL}/register`;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    
    // Validate form
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      // Store user ID in localStorage and update login state
      if (data.userId) {
        onLogin(data.userId);
        // Redirect to the main search bar page
        navigate('/');
        setSuccess(true);
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginRedirect = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl text-center mb-8">📰 panorama</h1>
        <h2 className="text-2xl text-center mb-6">Create Account</h2>
        
        {success ? (
          <div className="bg-green-800 bg-opacity-30 border border-green-600 text-white p-4 rounded-lg mb-4 text-center">
            Registration successful! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-800 bg-opacity-30 border border-red-600 text-white p-4 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-neutral-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all disabled:opacity-50"
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-neutral-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-neutral-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-gray-600 text-white rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Registering...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
            
            <div className="text-center mt-4">
              <p className="text-neutral-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleLoginRedirect}
                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegistrationPage;
