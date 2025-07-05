// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

class FileSystemError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

class PythonScriptError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

// Error Response Helper
const sendErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  const errorResponse = {
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: res.req?.originalUrl,
      method: res.req?.method
    }
  };

  // Add additional context in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error;
  }

  res.status(statusCode).json(errorResponse);
};

// Async Error Handler Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global Error Handling Middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ValidationError(message);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new NotFoundError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // File system errors
  if (err.code === 'ENOENT') {
    error = new FileSystemError('File not found');
  }

  if (err.code === 'EACCES') {
    error = new FileSystemError('Permission denied');
  }

  // Python script errors
  if (err.message && err.message.includes('Python script')) {
    error = new PythonScriptError(err.message);
  }

  sendErrorResponse(res, error);
};

// 404 Handler
const notFoundHandler = (req, res) => {
  const error = new NotFoundError('Endpoint');
  sendErrorResponse(res, error);
};

// Request Validation Helper
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Database Connection Error Handler
const handleDatabaseError = (error) => {
  console.error('Database Error:', {
    message: error.message,
    code: error.code,
    name: error.name
  });

  if (error.name === 'MongoNetworkError') {
    return new DatabaseError('Database connection failed');
  }

  if (error.name === 'MongoServerSelectionError') {
    return new DatabaseError('Unable to connect to database');
  }

  return new DatabaseError('Database operation failed');
};

// File System Error Handler
const handleFileSystemError = (error, filePath) => {
  console.error('File System Error:', {
    message: error.message,
    code: error.code,
    filePath
  });

  if (error.code === 'ENOENT') {
    return new FileSystemError(`File not found: ${filePath}`);
  }

  if (error.code === 'EACCES') {
    return new FileSystemError(`Permission denied: ${filePath}`);
  }

  return new FileSystemError(`File system error: ${error.message}`);
};

// Python Script Error Handler
const handlePythonScriptError = (error, scriptPath, stderr) => {
  console.error('Python Script Error:', {
    message: error.message,
    scriptPath,
    stderr
  });

  return new PythonScriptError(`Python script execution failed: ${error.message}`);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  FileSystemError,
  PythonScriptError,
  sendErrorResponse,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  validateRequest,
  handleDatabaseError,
  handleFileSystemError,
  handlePythonScriptError
}; 