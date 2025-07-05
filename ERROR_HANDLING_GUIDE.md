# Error Handling Guide

## Overview

This application implements a comprehensive error handling system with:
- Custom error classes
- Centralized error handling middleware
- Structured logging
- Input validation
- Database error handling
- File system error handling

## Error Classes

### AppError (Base Class)
```javascript
class AppError extends Error {
  constructor(message, statusCode, isOperational = true)
}
```

### Specific Error Classes
- `ValidationError` (400) - Input validation errors
- `NotFoundError` (404) - Resource not found
- `DatabaseError` (500) - Database operation failures
- `FileSystemError` (500) - File system errors
- `PythonScriptError` (500) - Python script execution errors

## Usage Examples

### Throwing Errors
```javascript
// Validation error
throw new ValidationError('Username is required');

// Not found error
throw new NotFoundError('User');

// Custom error
throw new AppError('Custom message', 422);
```

### Async Error Handling
```javascript
// Wrap async functions
router.get('/api/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));
```

### Input Validation
```javascript
// In routes
if (!username || !password) {
  throw new ValidationError('Username and password are required');
}

if (typeof username !== 'string' || username.trim().length < 3) {
  throw new ValidationError('Username must be at least 3 characters long');
}
```

## Error Response Format

### Standard Error Response
```json
{
  "error": {
    "message": "Username is required",
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/auth/signup",
    "method": "POST"
  }
}
```

### Development Mode (Additional Details)
```json
{
  "error": {
    "message": "Username is required",
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/auth/signup",
    "method": "POST",
    "stack": "Error stack trace...",
    "details": "Full error object..."
  }
}
```

## Logging System

### Log Levels
- `ERROR` (0) - Critical errors
- `WARN` (1) - Warning messages
- `INFO` (2) - Informational messages
- `DEBUG` (3) - Debug information

### Usage
```javascript
const logger = require('./utils/logger');

// Log levels
logger.error('Critical error occurred', { userId: 123 });
logger.warn('Warning message', { data: 'some data' });
logger.info('Information message', { operation: 'user_created' });
logger.debug('Debug information', { details: 'debug data' });

// Specialized logging
logger.logRequest(req, res, next);
logger.logError(error, req);
logger.logPerformance('database_query', 150);
logger.logDatabaseOperation('find', 'users', 50, true);
logger.logFileOperation('read', '/path/to/file', true);
logger.logPythonScript('/path/to/script.py', true, stdout, stderr);
```

## Database Error Handling

### Common Database Errors
- `MongoNetworkError` - Connection issues
- `MongoServerSelectionError` - Server selection issues
- `ValidationError` - Schema validation errors
- `CastError` - Invalid ObjectId
- `DuplicateKeyError` (11000) - Unique constraint violations

### Database Migration
```bash
# Fix database schema issues
npm run fix-db
```

## File System Error Handling

### Common File Errors
- `ENOENT` - File not found
- `EACCES` - Permission denied
- `EISDIR` - Expected file, got directory

### File Operations with Error Handling
```javascript
const fs = require('fs');
const { handleFileSystemError } = require('./utils/errorHandler');

try {
  const data = fs.readFileSync(filePath, 'utf8');
  logger.logFileOperation('read', filePath, true);
  return data;
} catch (error) {
  const fsError = handleFileSystemError(error, filePath);
  logger.logFileOperation('read', filePath, false, error);
  throw fsError;
}
```

## Python Script Error Handling

### Python Script Execution
```javascript
const { exec } = require('child_process');
const { handlePythonScriptError } = require('./utils/errorHandler');

exec(`python script.py "${param}"`, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    const pyError = handlePythonScriptError(error, 'script.py', stderr);
    logger.logPythonScript('script.py', false, stdout, stderr);
    throw pyError;
  }
  
  logger.logPythonScript('script.py', true, stdout, stderr);
  // Process stdout
});
```

## Middleware Setup

### Global Error Handler
```javascript
// Must be added before catch-all routes
app.use(globalErrorHandler);
```

### Request Logging
```javascript
// Add request logging middleware
app.use(logger.logRequest.bind(logger));
```

### 404 Handler
```javascript
// Handle API routes that don't exist
app.use('/api/*', notFoundHandler);
```

## Environment Variables

### Logging Configuration
```bash
LOG_LEVEL=INFO  # ERROR, WARN, INFO, DEBUG
NODE_ENV=production  # Affects error response detail level
```

## Testing Error Handling

### Test Error Scenarios
```bash
# Test validation error
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "", "password": "123"}'

# Test not found error
curl http://localhost:3001/api/nonexistent

# Test database error (when MongoDB is down)
curl http://localhost:3001/api/auth/signup
```

## Monitoring and Debugging

### Log Files
Logs are written to `backend/logs/`:
- `error.log` - Error messages
- `warn.log` - Warning messages
- `info.log` - Information messages
- `debug.log` - Debug messages

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Error Tracking
- All errors are logged with context
- Request details are captured
- Performance metrics are tracked
- Database operations are monitored

## Best Practices

### 1. Always Use asyncHandler
```javascript
// Good
router.get('/api/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));

// Bad
router.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 2. Validate Input Early
```javascript
// Good
if (!username || !password) {
  throw new ValidationError('Username and password are required');
}

// Bad
const user = new User({ username, password });
await user.save(); // May fail with unclear error
```

### 3. Use Specific Error Classes
```javascript
// Good
throw new ValidationError('Invalid input');
throw new NotFoundError('User');

// Bad
throw new Error('Something went wrong');
```

### 4. Log Errors with Context
```javascript
// Good
logger.error('User creation failed', {
  username: sanitizedUsername,
  error: error.message,
  stack: error.stack
});

// Bad
console.error('Error:', error);
```

### 5. Sanitize Input
```javascript
// Good
const sanitizedUsername = username.trim().toLowerCase();
const sanitizedPassword = password.trim();

// Bad
const user = new User({ username, password });
```

## Troubleshooting

### Common Issues

1. **Duplicate Key Errors**
   - Run database migration: `npm run fix-db`
   - Check for null/empty values
   - Verify unique constraints

2. **Validation Errors**
   - Check input sanitization
   - Verify required fields
   - Check data types

3. **File System Errors**
   - Verify file paths
   - Check permissions
   - Ensure files exist

4. **Python Script Errors**
   - Check Python environment
   - Verify script paths
   - Check dependencies

### Debug Mode
Set `LOG_LEVEL=DEBUG` for detailed logging:
```bash
LOG_LEVEL=DEBUG npm start
```

This will provide detailed information about all operations and help identify issues. 