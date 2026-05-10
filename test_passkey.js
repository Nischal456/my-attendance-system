import dbConnect from './lib/dbConnect.js';
import User from './models/User.js';

async function test() {
  await dbConnect();
  const user = await User.findOne({ email: "admin@geckoworksnepal.com" });
  console.log("Passkeys:", JSON.stringify(user.passkeys, null, 2));
  process.exit(0);
}
test();
