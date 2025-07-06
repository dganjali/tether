import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FormField from './FormField';
import LoadingSpinner from './LoadingSpinner';
import './Auth.css';
import logo from '../images/LOGO.png';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const result = await signup(formData.username, formData.password);
    
    if (result.success) {
      showSuccess('Account created successfully!');
      navigate('/dashboard');
    } else {
      showError(result.error || 'Sign up failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-container">
              <img src={logo} alt="Toronto Shelter Analytics" className="auth-logo-img" />
            </div>
          </div>
          <h1>Create Account</h1>
          <p>Join Toronto Shelter Analytics to access advanced insights</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {loading && <LoadingSpinner size="small" text="Creating account..." />}
          
          <FormField
            label="Username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username (min 3 characters)"
            required
            disabled={loading}
            error={errors.username}
            minLength={3}
            maxLength={30}
            autoComplete="username"
          />

          <FormField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Choose a password (min 6 characters)"
            required
            disabled={loading}
            error={errors.password}
            minLength={6}
            showPasswordToggle={true}
            autoComplete="new-password"
          />

          <FormField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            disabled={loading}
            error={errors.confirmPassword}
            showPasswordToggle={true}
            autoComplete="new-password"
          />

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/signin" className="auth-link">
              Sign in here
            </Link>
          </p>
          <Link to="/" className="auth-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 