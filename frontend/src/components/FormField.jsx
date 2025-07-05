import React, { useState } from 'react';
import './FormField.css';

const FormField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error = '',
  showPasswordToggle = false,
  autoComplete = 'off',
  minLength,
  maxLength,
  pattern,
  onBlur,
  onFocus
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const inputType = type === 'password' && showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div className={`form-field ${error ? 'form-field-error' : ''} ${isFocused ? 'form-field-focused' : ''}`}>
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      
      <div className="input-container">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`form-input ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}
        />
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {maxLength && (
        <div className="character-count">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default FormField; 