// fix-stuck-users.js
const mongoose = require('mongoose');
const User = require('./models/User').default; // Adjust path if your models are not in root
const Attendance = require('./models/Attendance').default; // Adjust path if your models are not in root
require('dotenv').config({ path: './.env.local' });

const fixStuckCheckins = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in your environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Find all active check-ins that are missing the workLocation field
    const stuckRecords = await Attendance.find({
      checkOutTime: null,
      workLocation: { $exists: false }
    });

    if (stuckRecords.length === 0) {
      console.log('✅ No stuck check-in records found. All active records are up-to-date.');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${stuckRecords.length} stuck record(s). Applying fix...`);

    // Update each record with a default location
    const updatePromises = stuckRecords.map(record => {
      record.workLocation = 'Office'; // Assign 'Office' as the default
      return record.save();
    });

    await Promise.all(updatePromises);

    console.log('✅ Successfully fixed all stuck check-in records!');

  } catch (error) {
    console.error('Error fixing records:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB Connection Closed.');
  }
};

fixStuckCheckins();