const mongoose = require('mongoose');
const RecordedData = require('./models/RecordedData');

// Test script for recorded data functionality
async function testRecordedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tether');
    console.log('Connected to MongoDB');

    // Test user ID (you can replace this with a real user ID)
    const testUserId = new mongoose.Types.ObjectId();

    // Test 1: Create a new recorded data entry
    console.log('\n=== Test 1: Creating recorded data ===');
    const testData = new RecordedData({
      userId: testUserId,
      shelterName: 'Test Shelter',
      currentOccupancy: 75,
      capacity: 100,
      notes: 'Test recording for demonstration'
    });

    await testData.save();
    console.log('✅ Recorded data created successfully');
    console.log('Data:', testData.getFormattedData());

    // Test 2: Get user statistics
    console.log('\n=== Test 2: Getting user statistics ===');
    const stats = await RecordedData.getUserStats(testUserId);
    console.log('✅ User statistics retrieved');
    console.log('Stats:', stats);

    // Test 3: Get shelter history
    console.log('\n=== Test 3: Getting shelter history ===');
    const history = await RecordedData.getShelterHistory(testUserId, 'Test Shelter');
    console.log('✅ Shelter history retrieved');
    console.log('History count:', history.length);

    // Test 4: Create multiple entries for the same shelter
    console.log('\n=== Test 4: Creating multiple entries ===');
    const additionalData = [
      {
        userId: testUserId,
        shelterName: 'Test Shelter',
        currentOccupancy: 80,
        capacity: 100,
        notes: 'Second recording'
      },
      {
        userId: testUserId,
        shelterName: 'Another Shelter',
        currentOccupancy: 45,
        capacity: 60,
        notes: 'Different shelter'
      }
    ];

    for (const data of additionalData) {
      const entry = new RecordedData(data);
      await entry.save();
      console.log(`✅ Created entry for ${data.shelterName}`);
    }

    // Test 5: Get updated statistics
    console.log('\n=== Test 5: Updated statistics ===');
    const updatedStats = await RecordedData.getUserStats(testUserId);
    console.log('✅ Updated statistics retrieved');
    console.log('Updated Stats:', updatedStats);

    // Test 6: Validation tests
    console.log('\n=== Test 6: Validation tests ===');
    
    // Test invalid data (should fail)
    try {
      const invalidData = new RecordedData({
        userId: testUserId,
        shelterName: 'Invalid Shelter',
        currentOccupancy: 150, // Exceeds capacity
        capacity: 100
      });
      await invalidData.save();
      console.log('❌ Invalid data was saved (should have failed)');
    } catch (error) {
      console.log('✅ Invalid data correctly rejected:', error.message);
    }

    // Test 7: Clean up test data
    console.log('\n=== Test 7: Cleaning up test data ===');
    await RecordedData.deleteMany({ userId: testUserId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRecordedData();
}

module.exports = { testRecordedData }; 