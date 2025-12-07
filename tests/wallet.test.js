
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Wallet from '../src/models/Wallet.js';

describe('Wallet module (basic)', () => {
  let server;
  beforeAll(async () => {
    const uri =
      "mongodb+srv://chinomsochristian03_db_user:VPRrbvrnJAAiyC3v@cluster0.tj4qti1.mongodb.net/dping?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  test('register creates user and wallet', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'u1', fullName: 'User One', nin: 'NIN123', password: 'pass123' });
    expect(res.statusCode).toBe(201);
    const userId = res.body.user.id;
    const wallet = await Wallet.findOne({ user: userId });
    expect(wallet).toBeTruthy();
    expect(wallet.balance).toBe(0);
  });
});
