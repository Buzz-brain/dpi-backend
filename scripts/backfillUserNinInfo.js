#!/usr/bin/env node
/*
  Backfill script: link User.ninInfo for existing users.
  Usage:
    node scripts/backfillUserNinInfo.js <MONGO_URI>
  Or set env var MONGO_URI and run without args.

  Behavior:
  - Finds users where `nin` exists and `ninInfo` is null/undefined.
  - Looks up NinInfo by `nin` and, if found, sets user.ninInfo to NinInfo._id
  - Idempotent: will skip users that already have ninInfo.
  - Logs summary at end.
*/

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import NinInfo from '../src/models/NinInfo.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

async function main() {
  const mongoUri = process.argv[2] || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MongoDB URI. Provide as first arg or via MONGO_URI env var.');
    process.exit(1);
  }

  await connectDB(mongoUri);

  try {
    const query = { nin: { $exists: true, $ne: null }, $or: [{ ninInfo: { $exists: false } }, { ninInfo: null }] };
    const cursor = User.find(query).cursor();
    let total = 0;
    let linked = 0;
    let notFound = 0;

    for (let user = await cursor.next(); user != null; user = await cursor.next()) {
      total += 1;
      try {
        const nin = user.nin;
        if (!nin) continue;
        const ninInfo = await NinInfo.findOne({ nin });
        if (ninInfo) {
          user.ninInfo = ninInfo._id;
          await user.save();
          linked += 1;
          console.log(`Linked user ${user._id} (nin=${nin}) -> ninInfo=${ninInfo._id}`);
        } else {
          notFound += 1;
          console.log(`No NinInfo for user ${user._id} (nin=${nin})`);
        }
      } catch (err) {
        console.error(`Error processing user ${user._id}:`, err.message || err);
      }
    }

    console.log('--- Summary ---');
    console.log(`Total candidates scanned: ${total}`);
    console.log(`Linked: ${linked}`);
    console.log(`NinInfo not found: ${notFound}`);
    console.log('Done');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
