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
  console.log("Superadmin Email:", users.find(u => u.role === 'Superadmin')?.email);
  await client.close();
}
run();
