const mongoose = require('mongoose');

const recordedDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shelterName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  currentOccupancy: {
    type: Number,
    required: true,
    min: 0,
    max: 10000 // Reasonable maximum for shelter occupancy
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 10000 // Reasonable maximum for shelter capacity
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  utilization: {
    type: Number,
    min: 0,
    max: 1000, // Allow over 100% for overflow situations
    default: function() {
      return this.capacity > 0 ? Math.round((this.currentOccupancy / this.capacity) * 100 * 100) / 100 : 0;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient queries
recordedDataSchema.index({ userId: 1, shelterName: 1, timestamp: -1 });

// Virtual for formatted timestamp
recordedDataSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for status based on utilization
recordedDataSchema.virtual('status').get(function() {
  if (this.utilization > 100) return 'critical';
  if (this.utilization > 80) return 'warning';
  return 'normal';
});

// Pre-save middleware to calculate utilization
recordedDataSchema.pre('save', function(next) {
  if (this.capacity > 0) {
    this.utilization = Math.round((this.currentOccupancy / this.capacity) * 100 * 100) / 100;
  }
  next();
});

// Static method to get statistics for a user
recordedDataSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        uniqueShelters: { $addToSet: '$shelterName' },
        avgOccupancy: { $avg: '$currentOccupancy' },
        avgCapacity: { $avg: '$capacity' },
        avgUtilization: { $avg: '$utilization' },
        maxUtilization: { $max: '$utilization' },
        minUtilization: { $min: '$utilization' }
      }
    },
    {
      $project: {
        _id: 0,
        totalRecords: 1,
        uniqueShelters: { $size: '$uniqueShelters' },
        avgOccupancy: { $round: ['$avgOccupancy', 2] },
        avgCapacity: { $round: ['$avgCapacity', 2] },
        avgUtilization: { $round: ['$avgUtilization', 2] },
        maxUtilization: { $round: ['$maxUtilization', 2] },
        minUtilization: { $round: ['$minUtilization', 2] }
      }
    }
  ]);

  return stats[0] || {
    totalRecords: 0,
    uniqueShelters: 0,
    avgOccupancy: 0,
    avgCapacity: 0,
    avgUtilization: 0,
    maxUtilization: 0,
    minUtilization: 0
  };
};

// Static method to get shelter history
recordedDataSchema.statics.getShelterHistory = async function(userId, shelterName, limit = 50) {
  return await this.find({
    userId: mongoose.Types.ObjectId(userId),
    shelterName: { $regex: shelterName, $options: 'i' }
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('-__v');
};

// Instance method to get formatted data
recordedDataSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    shelterName: this.shelterName,
    currentOccupancy: this.currentOccupancy,
    capacity: this.capacity,
    utilization: this.utilization,
    status: this.status,
    notes: this.notes,
    timestamp: this.timestamp,
    formattedTimestamp: this.formattedTimestamp,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Validation middleware
recordedDataSchema.pre('validate', function(next) {
  // Ensure current occupancy doesn't exceed capacity (unless explicitly allowed for overflow)
  if (this.currentOccupancy > this.capacity) {
    this.invalidate('currentOccupancy', 'Current occupancy cannot exceed capacity');
  }
  
  // Ensure positive values
  if (this.currentOccupancy < 0) {
    this.invalidate('currentOccupancy', 'Current occupancy must be non-negative');
  }
  
  if (this.capacity <= 0) {
    this.invalidate('capacity', 'Capacity must be positive');
  }
  
  next();
});

module.exports = mongoose.model('RecordedData', recordedDataSchema); 