import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios defaults
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const signup = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/signup', {
        username,
        password
      });
      
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Signup failed';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Map common error messages to user-friendly ones
      if (errorMessage.includes('Username already exists')) {
        errorMessage = 'This username is already taken. Please choose a different one.';
      } else if (errorMessage.includes('Username and password are required')) {
        errorMessage = 'Please enter both username and password';
      } else if (errorMessage.includes('Username must be at least 3 characters long')) {
        errorMessage = 'Username must be at least 3 characters long';
      } else if (errorMessage.includes('Password must be at least 6 characters long')) {
        errorMessage = 'Password must be at least 6 characters long';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const signin = async (username, password) => {
    try {
      console.log('Attempting signin with:', { username });
      
      const response = await axios.post('/api/auth/signin', {
        username,
        password
      });
      
      console.log('Signin response:', response.data);
      
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Signin error:', error);
      console.error('Error response:', error.response?.data);
      
      console.error('Error response structure:', error.response?.data);
      
      let errorMessage = 'Signin failed';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Map common error messages to user-friendly ones
      if (errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Invalid username or password';
      } else if (errorMessage.includes('Username and password are required')) {
        errorMessage = 'Please enter both username and password';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    signup,
    signin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 