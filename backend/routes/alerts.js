const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');

// GET /api/alerts - Get all alerts for user
router.get('/', auth, async (req, res) => {
  try {
    const { type, acknowledged, shelter, limit = 50, page = 1 } = req.query;
    
    let query = { userId: req.user.id };
    
    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Filter by acknowledgment status
    if (acknowledged !== undefined) {
      query.acknowledged = acknowledged === 'true';
    }
    
    // Filter by shelter
    if (shelter && shelter !== 'all') {
      query.shelter = { $regex: shelter, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Alert.countDocuments(query);
    
    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/alerts - Create new alert
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, message, shelter, priority = 'medium' } = req.body;
    
    // Validate required fields
    if (!type || !title || !message) {
      return res.status(400).json({ 
        message: 'Type, title, and message are required' 
      });
    }
    
    // Validate alert type
    const validTypes = ['critical', 'warning', 'info', 'success'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid alert type. Must be critical, warning, info, or success' 
      });
    }
    
    const newAlert = new Alert({
      userId: req.user.id,
      type,
      title,
      message,
      shelter: shelter || 'System-wide',
      priority,
      timestamp: new Date(),
      acknowledged: false
    });
    
    await newAlert.save();
    
    res.status(201).json({
      message: 'Alert created successfully',
      alert: newAlert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/alerts/:id/acknowledge - Acknowledge an alert
router.post('/:id/acknowledge', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Check if user owns this alert
    if (alert.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to acknowledge this alert' });
    }
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await alert.save();
    
    res.json({
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/alerts/:id - Update an alert
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, title, message, shelter, priority } = req.body;
    
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Check if user owns this alert
    if (alert.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this alert' });
    }
    
    // Update fields
    if (type) alert.type = type;
    if (title) alert.title = title;
    if (message) alert.message = message;
    if (shelter) alert.shelter = shelter;
    if (priority) alert.priority = priority;
    
    alert.updatedAt = new Date();
    await alert.save();
    
    res.json({
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/alerts/:id - Delete an alert
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Check if user owns this alert
    if (alert.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this alert' });
    }
    
    await Alert.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/alerts/bulk-acknowledge - Acknowledge multiple alerts
router.post('/bulk-acknowledge', auth, async (req, res) => {
  try {
    const { alertIds } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({ message: 'Alert IDs array is required' });
    }
    
    const result = await Alert.updateMany(
      { 
        _id: { $in: alertIds },
        userId: req.user.id 
      },
      { 
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    );
    
    res.json({
      message: `${result.modifiedCount} alerts acknowledged successfully`
    });
  } catch (error) {
    console.error('Error bulk acknowledging alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$type', 'critical'] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ['$type', 'warning'] }, 1, 0] } },
          info: { $sum: { $cond: [{ $eq: ['$type', 'info'] }, 1, 0] } },
          success: { $sum: { $cond: [{ $eq: ['$type', 'success'] }, 1, 0] } },
          acknowledged: { $sum: { $cond: ['$acknowledged', 1, 0] } },
          unacknowledged: { $sum: { $cond: ['$acknowledged', 0, 1] } }
        }
      }
    ]);
    
    const result = stats[0] || {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      success: 0,
      acknowledged: 0,
      unacknowledged: 0
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/alerts/generate-system-alerts - Generate system alerts based on predictions
router.post('/generate-system-alerts', auth, async (req, res) => {
  try {
    // This endpoint would analyze current predictions and generate alerts
    // For now, we'll create some sample system alerts
    
    const systemAlerts = [
      {
        type: 'critical',
        title: 'High Capacity Alert',
        message: 'Multiple shelters are approaching or exceeding capacity limits.',
        shelter: 'System-wide',
        priority: 'high'
      },
      {
        type: 'warning',
        title: 'Weather Advisory',
        message: 'Severe weather conditions expected. Prepare for increased demand.',
        shelter: 'System-wide',
        priority: 'medium'
      },
      {
        type: 'info',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight at 2 AM.',
        shelter: 'System-wide',
        priority: 'low'
      }
    ];
    
    const createdAlerts = [];
    
    for (const alertData of systemAlerts) {
      const newAlert = new Alert({
        userId: req.user.id,
        ...alertData,
        timestamp: new Date(),
        acknowledged: false
      });
      
      await newAlert.save();
      createdAlerts.push(newAlert);
    }
    
    res.status(201).json({
      message: `${createdAlerts.length} system alerts generated`,
      alerts: createdAlerts
    });
  } catch (error) {
    console.error('Error generating system alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 