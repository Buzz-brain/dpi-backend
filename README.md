# DPI Backend (JavaScript) - Wallet module bootstrap

This is a minimal JavaScript Express backend scaffold with a wallet module.

Quick start:

1. copy `.env.example` to `.env` and set MONGO_URI and JWT_SECRET
2. npm install
3. npm run dev

Endpoints added in this phase:
- POST /api/auth/register  (creates user + wallet)
- POST /api/auth/login
- GET /api/wallet/:userId  (requires Authorization: Bearer <token>)
- POST /api/wallet/:userId/topup  (admin only)
