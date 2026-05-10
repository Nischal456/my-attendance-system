const { MongoClient } = require('mongodb');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/MONGODB_URI=(.*)/);
const uri = match[1];

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const users = await db.collection('users').find({}).toArray();
  // Check if any user has an invalid value for createdBy or promotedBy
  for(const u of users) {
     if(u.createdBy && typeof u.createdBy === 'string') {
        console.log("String createdBy:", u.email, u.createdBy);
     }
  }
  
  await client.close();
}
run();
