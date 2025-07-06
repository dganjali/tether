# Data Recording Feature

## Overview

The Data Recording feature allows users to record real-time shelter occupancy data and view it alongside predicted data in interactive charts. This feature provides a comprehensive view of both actual and predicted shelter utilization.

## Features

### 1. Data Recording Form
- **Location**: Dashboard → Data Recording Section
- **Functionality**: 
  - Record current occupancy for any shelter
  - Set shelter capacity
  - Add optional notes
  - Automatic timestamp recording
  - Form validation and error handling

### 2. Quick Record Button
- **Location**: Each shelter card in the dashboard
- **Functionality**: 
  - One-click data recording
  - Pre-fills shelter name and capacity
  - Automatically opens recording form
  - Smooth scroll to form

### 3. Charts View
- **Location**: Dashboard → Charts View tab
- **Functionality**:
  - Interactive bar charts
  - Compare recorded vs predicted data
  - Multiple chart types (Occupancy, Utilization, Trends)
  - Shelter-specific data filtering

## API Endpoints

### GET /api/recorded-data
- **Purpose**: Retrieve user's recorded data
- **Authentication**: Required
- **Response**: Array of recorded data entries

### POST /api/recorded-data
- **Purpose**: Record new shelter data
- **Authentication**: Required
- **Body**:
  ```json
  {
    "shelterName": "string",
    "currentOccupancy": "number",
    "capacity": "number",
    "notes": "string (optional)",
    "timestamp": "ISO string (optional)"
  }
  ```

### GET /api/recorded-data/:shelterName
- **Purpose**: Get recorded data for specific shelter
- **Authentication**: Required
- **Response**: Array of shelter-specific data

### DELETE /api/recorded-data/:id
- **Purpose**: Delete specific recorded data entry
- **Authentication**: Required
- **Authorization**: User must own the data

### GET /api/recorded-data/stats/summary
- **Purpose**: Get summary statistics for user's recorded data
- **Authentication**: Required
- **Response**: Statistics object

## Database Schema

### RecordedData Model
```javascript
{
  userId: ObjectId,           // Reference to User
  shelterName: String,        // Name of the shelter
  currentOccupancy: Number,   // Current number of occupants
  capacity: Number,           // Total shelter capacity
  notes: String,             // Optional notes
  timestamp: Date,           // When data was recorded
  utilization: Number,       // Calculated utilization percentage
  createdAt: Date,          // Record creation time
  updatedAt: Date           // Record update time
}
```

## Usage Examples

### Recording Data via Form
1. Navigate to Dashboard
2. Click "Show Recording Form" in Data Recording section
3. Fill in shelter name, current occupancy, and capacity
4. Add optional notes
5. Click "Record Data"

### Quick Recording
1. Find a shelter card in the dashboard
2. Click the 📝 button (Quick Record)
3. Form will be pre-filled with shelter info
4. Enter current occupancy
5. Submit the form

### Viewing Charts
1. Switch to "Charts View" in the dashboard
2. Select a shelter from the dropdown
3. Choose chart type (Occupancy, Utilization, Trends)
4. View recorded vs predicted data comparison

## Validation Rules

- **Shelter Name**: Required, max 200 characters
- **Current Occupancy**: Required, 0-10,000, must be ≤ capacity
- **Capacity**: Required, 1-10,000
- **Notes**: Optional, max 1,000 characters
- **Utilization**: Automatically calculated as (occupancy/capacity) × 100

## Error Handling

- **Validation Errors**: Clear error messages for invalid data
- **Network Errors**: Graceful handling of API failures
- **Authentication Errors**: Redirect to login if token invalid
- **Authorization Errors**: Prevent unauthorized data access

## Testing

Run the test script to verify functionality:
```bash
cd backend
node test-recorded-data.js
```

## Security Features

- **User Isolation**: Users can only access their own recorded data
- **Input Validation**: Server-side validation of all inputs
- **Authentication Required**: All endpoints require valid JWT token
- **Authorization Checks**: Users can only modify their own data

## Performance Considerations

- **Indexing**: Compound indexes on userId, shelterName, and timestamp
- **Pagination**: Limited to 100 records per query
- **Caching**: Consider implementing Redis for frequently accessed data
- **Database Optimization**: Efficient queries with proper indexing

## Future Enhancements

1. **Bulk Data Import**: CSV/Excel file upload
2. **Data Export**: Export recorded data to various formats
3. **Advanced Analytics**: Trend analysis and forecasting
4. **Real-time Updates**: WebSocket integration for live data
5. **Mobile App**: Native mobile application for data recording
6. **API Rate Limiting**: Prevent abuse of recording endpoints
7. **Data Backup**: Automated backup of recorded data
8. **Audit Trail**: Track all data modifications

## Troubleshooting

### Common Issues

1. **"Failed to record data"**
   - Check authentication token
   - Verify all required fields are filled
   - Ensure current occupancy ≤ capacity

2. **"No data available for this shelter"**
   - Record some data for the shelter first
   - Check if shelter name matches exactly

3. **Charts not loading**
   - Ensure recorded data exists
   - Check browser console for errors
   - Verify API endpoints are accessible

### Debug Mode

Enable debug logging in the backend:
```javascript
// In server.js
process.env.DEBUG = 'true';
```

## Contributing

When adding new features to the data recording system:

1. Update the database schema if needed
2. Add appropriate validation
3. Include error handling
4. Write tests for new functionality
5. Update this documentation
6. Consider security implications
7. Test with various data scenarios 