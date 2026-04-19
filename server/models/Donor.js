const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 18 },
    gender: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    lastDonationDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donor", donorSchema);
