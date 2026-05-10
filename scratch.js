require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection;
    const nischal = await db.collection('users').findOne({ email: 'nischal@geckoworksnepal.com' });
    console.log("Nischal accessRoles:", nischal.accessRoles);
    process.exit(0);
}).catch(console.error);
