const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');

// Get all alerts for the authenticated user
router.get('/', auth, asyncHandler(async (req, res) => {
  const { type, acknowledged } = req.query;
  
  let query = { userId: req.user.id };
  
  // Filter by type if provided
  if (type && ['critical', 'warning', 'info'].includes(type)) {
    query.type = type;
  }
  
  // Filter by acknowledged status if provided
  if (acknowledged !== undefined) {
    query.acknowledged = acknowledged === 'true';
  }
  
  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .limit(50); // Limit to prevent overwhelming response
  
  res.json(alerts);
}));

// Create a new alert
router.post('/', auth, asyncHandler(async (req, res) => {
  const { type, title, message, shelter, expiresAt } = req.body;
  
  // Validate required fields
  if (!type || !title || !message || !shelter) {
    return res.status(400).json({
      error: 'Type, title, message, and shelter are required fields'
    });
  }
  
  // Validate type
  if (!['critical', 'warning', 'info'].includes(type)) {
    return res.status(400).json({
      error: 'Type must be one of: critical, warning, info'
    });
  }
  
  const alert = new Alert({
    userId: req.user.id,
    type,
    title,
    message,
    shelter,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  });
  
  await alert.save();
  res.status(201).json(alert);
}));

// Acknowledge an alert
router.post('/:id/acknowledge', auth, asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!alert) {
    return res.status(404).json({
      error: 'Alert not found'
    });
  }
  
  alert.acknowledged = true;
  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = req.user.id;
  
  await alert.save();
  res.json(alert);
}));

// Delete an alert
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const alert = await Alert.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!alert) {
    return res.status(404).json({
      error: 'Alert not found'
    });
  }
  
  res.json({ message: 'Alert deleted successfully' });
}));

// Get alert statistics
router.get('/stats', auth, asyncHandler(async (req, res) => {
  const stats = await Alert.aggregate([
    { $match: { userId: req.user.id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ['$type', 'critical'] }, 1, 0] }
        },
        warning: {
          $sum: { $cond: [{ $eq: ['$type', 'warning'] }, 1, 0] }
        },
        info: {
          $sum: { $cond: [{ $eq: ['$type', 'info'] }, 1, 0] }
        },
        unacknowledged: {
          $sum: { $cond: ['$acknowledged', 0, 1] }
        }
      }
    }
  ]);
  
  const result = stats[0] || {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    unacknowledged: 0
  };
  
  res.json(result);
}));

// Bulk acknowledge alerts
router.post('/bulk-acknowledge', auth, asyncHandler(async (req, res) => {
  const { alertIds } = req.body;
  
  if (!alertIds || !Array.isArray(alertIds)) {
    return res.status(400).json({
      error: 'Alert IDs array is required'
    });
  }
  
  const result = await Alert.updateMany(
    {
      _id: { $in: alertIds },
      userId: req.user.id
    },
    {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user.id
    }
  );
  
  res.json({
    message: `${result.modifiedCount} alerts acknowledged`,
    modifiedCount: result.modifiedCount
  });
}));

module.exports = router; 