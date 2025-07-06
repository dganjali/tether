const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RecordedData = require('../models/RecordedData');

// GET /api/recorded-data - Get all recorded data
router.get('/', auth, async (req, res) => {
  try {
    const recordedData = await RecordedData.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 records
    
    res.json(recordedData);
  } catch (error) {
    console.error('Error fetching recorded data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recorded-data - Record new shelter data
router.post('/', auth, async (req, res) => {
  try {
    const { shelterName, currentOccupancy, capacity, notes, timestamp } = req.body;

    // Validate required fields
    if (!shelterName || currentOccupancy === undefined || !capacity) {
      return res.status(400).json({ 
        message: 'Shelter name, current occupancy, and capacity are required' 
      });
    }

    // Validate data types
    if (typeof currentOccupancy !== 'number' || typeof capacity !== 'number') {
      return res.status(400).json({ 
        message: 'Current occupancy and capacity must be numbers' 
      });
    }

    // Validate ranges
    if (currentOccupancy < 0 || capacity <= 0) {
      return res.status(400).json({ 
        message: 'Current occupancy must be >= 0 and capacity must be > 0' 
      });
    }

    if (currentOccupancy > capacity) {
      return res.status(400).json({ 
        message: 'Current occupancy cannot exceed capacity' 
      });
    }

    // Create new recorded data entry
    const newRecordedData = new RecordedData({
      userId: req.user.id,
      shelterName,
      currentOccupancy,
      capacity,
      notes: notes || '',
      timestamp: timestamp || new Date()
    });

    await newRecordedData.save();

    res.status(201).json({
      message: 'Data recorded successfully',
      data: newRecordedData
    });

  } catch (error) {
    console.error('Error recording data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recorded-data/:shelterName - Get recorded data for specific shelter
router.get('/:shelterName', auth, async (req, res) => {
  try {
    const { shelterName } = req.params;
    
    const recordedData = await RecordedData.find({
      userId: req.user.id,
      shelterName: { $regex: shelterName, $options: 'i' }
    })
    .sort({ timestamp: -1 })
    .limit(50);
    
    res.json(recordedData);
  } catch (error) {
    console.error('Error fetching shelter recorded data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/recorded-data/:id - Delete specific recorded data entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const recordedData = await RecordedData.findById(req.params.id);
    
    if (!recordedData) {
      return res.status(404).json({ message: 'Recorded data not found' });
    }
    
    // Check if user owns this data
    if (recordedData.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this data' });
    }
    
    await RecordedData.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Recorded data deleted successfully' });
  } catch (error) {
    console.error('Error deleting recorded data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recorded-data/stats/summary - Get summary statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await RecordedData.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          uniqueShelters: { $addToSet: '$shelterName' },
          avgOccupancy: { $avg: '$currentOccupancy' },
          avgCapacity: { $avg: '$capacity' },
          totalOccupancy: { $sum: '$currentOccupancy' },
          totalCapacity: { $sum: '$capacity' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          uniqueShelters: { $size: '$uniqueShelters' },
          avgOccupancy: { $round: ['$avgOccupancy', 2] },
          avgCapacity: { $round: ['$avgCapacity', 2] },
          avgUtilization: {
            $round: [
              { $multiply: [{ $divide: ['$totalOccupancy', '$totalCapacity'] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalRecords: 0,
      uniqueShelters: 0,
      avgOccupancy: 0,
      avgCapacity: 0,
      avgUtilization: 0
    });
  } catch (error) {
    console.error('Error fetching recorded data stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 