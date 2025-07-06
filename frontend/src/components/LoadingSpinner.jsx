import React from 'react';
import './styles.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', type = 'spinner' }) => {
  const sizeClass = `spinner-${size}`;
  const typeClass = `spinner-${type}`;

  return (
    <div className={`loading-container flex flex-column ${sizeClass}`} aria-live="polite" aria-busy="true">
      {type === 'spinner' && (
        <div className={`loading-spinner ${typeClass}`} role="status">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      )}
      
      {type === 'dots' && (
        <div className={`loading-dots ${typeClass}`} role="status">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      )}
      
      {type === 'pulse' && (
        <div className={`loading-pulse ${typeClass}`} role="status">
          <div className="pulse-circle"></div>
        </div>
      )}
      
      {text && (
        <p className="loading-text">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;