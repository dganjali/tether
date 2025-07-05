const express = require('express');
const router = express.Router();
const UserShelter = require('../models/UserShelter');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorHandler');

// Get all shelters for the authenticated user
router.get('/', auth, asyncHandler(async (req, res) => {
  const shelters = await UserShelter.find({ userId: req.user.id })
    .sort({ createdAt: -1 });
  
  res.json(shelters);
}));

// Add a new shelter for the authenticated user
router.post('/', auth, asyncHandler(async (req, res) => {
  const { name, address, capacity, contactPerson, phone, email } = req.body;
  
  // Validate required fields
  if (!name || !address || !capacity) {
    return res.status(400).json({
      error: 'Name, address, and capacity are required fields'
    });
  }
  
  // Validate capacity is a positive number
  if (isNaN(capacity) || capacity <= 0) {
    return res.status(400).json({
      error: 'Capacity must be a positive number'
    });
  }
  
  const shelter = new UserShelter({
    userId: req.user.id,
    name,
    address,
    capacity: parseInt(capacity),
    contactPerson,
    phone,
    email
  });
  
  await shelter.save();
  res.status(201).json(shelter);
}));

// Update a shelter
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { name, address, capacity, contactPerson, phone, email } = req.body;
  
  const shelter = await UserShelter.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!shelter) {
    return res.status(404).json({
      error: 'Shelter not found'
    });
  }
  
  // Update fields
  if (name) shelter.name = name;
  if (address) shelter.address = address;
  if (capacity) {
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({
        error: 'Capacity must be a positive number'
      });
    }
    shelter.capacity = parseInt(capacity);
  }
  if (contactPerson !== undefined) shelter.contactPerson = contactPerson;
  if (phone !== undefined) shelter.phone = phone;
  if (email !== undefined) shelter.email = email;
  
  await shelter.save();
  res.json(shelter);
}));

// Delete a shelter
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const shelter = await UserShelter.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!shelter) {
    return res.status(404).json({
      error: 'Shelter not found'
    });
  }
  
  res.json({ message: 'Shelter deleted successfully' });
}));

// Get a specific shelter
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const shelter = await UserShelter.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!shelter) {
    return res.status(404).json({
      error: 'Shelter not found'
    });
  }
  
  res.json(shelter);
}));

module.exports = router; 