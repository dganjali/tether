import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', type = 'spinner' }) => {
  const sizeClass = `spinner-${size}`;
  const typeClass = `spinner-${type}`;

  return (
    <div className={`loading-container ${sizeClass}`}>
      {type === 'spinner' && (
        <div className={`loading-spinner ${typeClass}`}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      )}
      
      {type === 'dots' && (
        <div className={`loading-dots ${typeClass}`}>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      )}
      
      {type === 'pulse' && (
        <div className={`loading-pulse ${typeClass}`}>
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