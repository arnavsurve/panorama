import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // API URLs
  const API_BASE_URL = 'http://localhost:8000';
  const LOGIN_URL = `${API_BASE_URL}/login`;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    
    // Validate form
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(LOGIN_URL, {
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
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterRedirect = () => {
    navigate('/register');
  };
  
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl text-center mb-8">📰 panorama</h1>
        <h2 className="text-2xl text-center mb-6">Log In</h2>
        
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
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="flex justify-center items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Logging in...
              </div>
            ) : (
              'Log In'
            )}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-neutral-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleRegisterRedirect}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
