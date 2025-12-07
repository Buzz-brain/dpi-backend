import axios from 'axios';
import { PAYSTACK_SECRET_KEY, PAYSTACK_BASE_URL } from '../config/paystack.js';

export async function initializePaystackTransaction(email, amount) {
  const res = await axios.post(
    PAYSTACK_BASE_URL + '/transaction/initialize',
    { email, amount },
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
  );
  return res.data.data;
}

export async function verifyPaystackTransaction(reference) {
  const res = await axios.get(
    PAYSTACK_BASE_URL + '/transaction/verify/' + reference,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
  );
  return res.data.data;
}
