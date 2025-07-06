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
    <div
      className={`form-field ${error ? 'form-field-error' : ''} ${isFocused ? 'form-field-focused' : ''}`}
      role="group"
      aria-labelledby={`${name}-label`}
    >
      <label id={`${name}-label`} htmlFor={name} className="form-label">
        {label}
        {required && <span className="required-asterisk" aria-hidden="true">*</span>}
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
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`form-input ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className="toggle-password-button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <p id={`${name}-error`} className="form-error" role="alert">{error}</p>}
    </div>
  );
};

export default FormField;