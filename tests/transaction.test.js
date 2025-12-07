
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Wallet from '../src/models/Wallet.js';


let user1, user2, token1, token2;

describe('Transaction endpoints', () => {
  beforeAll(async () => {
    const uri =
      "mongodb+srv://chinomsochristian03_db_user:VPRrbvrnJAAiyC3v@cluster0.tj4qti1.mongodb.net/dping?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    // Register two users
    let res = await request(app).post('/api/auth/register').send({ username: 'u1', fullName: 'User One', nin: 'NIN1', password: 'pass1' });
    user1 = res.body.user;
    res = await request(app).post('/api/auth/login').send({ nin: 'NIN1', password: 'pass1' });
    token1 = res.body.token;
    res = await request(app).post('/api/auth/register').send({ username: 'u2', fullName: 'User Two', nin: 'NIN2', password: 'pass2' });
    user2 = res.body.user;
    res = await request(app).post('/api/auth/login').send({ nin: 'NIN2', password: 'pass2' });
    token2 = res.body.token;
    // Top up user1 wallet for testing
    await Wallet.findOneAndUpdate({ user: user1.id }, { $set: { balance: 1000 } });
  });

  beforeAll(async () => {
    const uri = 'mongodb://127.0.0.1:27017/dpi_test';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    // Clean test DB before running
    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    // Register two users
    let res = await request(app).post('/api/auth/register').send({ username: 'u1', fullName: 'User One', nin: 'NIN1', password: 'pass1' });
    user1 = res.body.user;
    res = await request(app).post('/api/auth/login').send({ nin: 'NIN1', password: 'pass1' });
    token1 = res.body.token;
    res = await request(app).post('/api/auth/register').send({ username: 'u2', fullName: 'User Two', nin: 'NIN2', password: 'pass2' });
    user2 = res.body.user;
    res = await request(app).post('/api/auth/login').send({ nin: 'NIN2', password: 'pass2' });
    token2 = res.body.token;
    // Top up user1 wallet for testing
    await Wallet.findOneAndUpdate({ user: user1.id }, { $set: { balance: 1000 } });
  }, 20000);

  test('withdrawal', async () => {
    const res = await request(app)
      .post('/api/transactions/withdraw')
      .set('Authorization', `Bearer ${token1}`)
      .send({ amount: 100 });
    expect(res.statusCode).toBe(201);
    expect(res.body.transaction.amount).toBe(100);
  });

  test('get transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });
});
