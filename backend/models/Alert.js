const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['critical', 'warning', 'info', 'success'],
    default: 'info'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  shelter: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'System-wide'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  acknowledged: {
    type: Boolean,
    default: false,
    index: true
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
alertSchema.index({ userId: 1, type: 1, timestamp: -1 });
alertSchema.index({ userId: 1, acknowledged: 1, timestamp: -1 });
alertSchema.index({ userId: 1, shelter: 1, timestamp: -1 });

// Virtual for formatted timestamp
alertSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for time since creation
alertSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m ago`;
  } else {
    return `${diffMinutes}m ago`;
  }
});

// Virtual for alert status
alertSchema.virtual('status').get(function() {
  if (this.expiresAt && new Date() > this.expiresAt) {
    return 'expired';
  }
  if (this.acknowledged) {
    return 'acknowledged';
  }
  return 'active';
});

// Static method to get user alert statistics
alertSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ['$type', 'critical'] }, 1, 0] } },
        warning: { $sum: { $cond: [{ $eq: ['$type', 'warning'] }, 1, 0] } },
        info: { $sum: { $cond: [{ $eq: ['$type', 'info'] }, 1, 0] } },
        success: { $sum: { $cond: [{ $eq: ['$type', 'success'] }, 1, 0] } },
        acknowledged: { $sum: { $cond: ['$acknowledged', 1, 0] } },
        unacknowledged: { $sum: { $cond: ['$acknowledged', 0, 1] } },
        active: { $sum: { $cond: [{ $and: [{ $eq: ['$acknowledged', false] }, { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', new Date()] }] }] }, 1, 0] } }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    success: 0,
    acknowledged: 0,
    unacknowledged: 0,
    active: 0
  };
};

// Static method to get recent alerts
alertSchema.statics.getRecentAlerts = async function(userId, limit = 10) {
  return await this.find({
    userId: mongoose.Types.ObjectId(userId),
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('-__v');
};

// Instance method to acknowledge alert
alertSchema.methods.acknowledge = async function(userId) {
  this.acknowledged = true;
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = userId;
  return await this.save();
};

// Instance method to get formatted data
alertSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    shelter: this.shelter,
    priority: this.priority,
    acknowledged: this.acknowledged,
    acknowledgedAt: this.acknowledgedAt,
    expiresAt: this.expiresAt,
    timestamp: this.timestamp,
    formattedTimestamp: this.formattedTimestamp,
    timeAgo: this.timeAgo,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Pre-save middleware to handle expiration
alertSchema.pre('save', function(next) {
  // If alert is expired, mark as acknowledged
  if (this.expiresAt && new Date() > this.expiresAt && !this.acknowledged) {
    this.acknowledged = true;
    this.acknowledgedAt = new Date();
  }
  next();
});

// Validation middleware
alertSchema.pre('validate', function(next) {
  // Ensure title is not empty
  if (!this.title || this.title.trim().length === 0) {
    this.invalidate('title', 'Title cannot be empty');
  }
  
  // Ensure message is not empty
  if (!this.message || this.message.trim().length === 0) {
    this.invalidate('message', 'Message cannot be empty');
  }
  
  // Ensure shelter is not empty
  if (!this.shelter || this.shelter.trim().length === 0) {
    this.invalidate('shelter', 'Shelter cannot be empty');
  }
  
  next();
});

module.exports = mongoose.model('Alert', alertSchema); 