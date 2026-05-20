require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection;
    const users = await db.collection('users').find({}).toArray();
    console.log("Users:", users.map(u => ({ name: u.name, email: u.email, role: u.role })));
    process.exit(0);
}).catch(console.error);
