import mongoose from "mongoose";
const { Schema } = mongoose;

const OtpSchema = new Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", OtpSchema);
export default Otp;
