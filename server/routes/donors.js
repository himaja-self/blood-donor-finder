const express = require("express");
const Donor = require("../models/Donor");

const router = express.Router();

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

function validateDonorBody(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) errors.push("Name is required.");
    else data.name = name;
  }

  if (!partial || body.age !== undefined) {
    const age = Number(body.age);
    if (body.age === "" || body.age === undefined) {
      if (!partial) errors.push("Age is required.");
    } else if (!Number.isFinite(age) || age < 18) {
      errors.push("Age must be a number and at least 18.");
    } else {
      data.age = age;
    }
  }

  if (!partial || body.gender !== undefined) {
    const gender =
      typeof body.gender === "string" ? body.gender.trim() : "";
    if (!gender) errors.push("Gender is required.");
    else data.gender = gender;
  }

  if (!partial || body.bloodGroup !== undefined) {
    const bg =
      typeof body.bloodGroup === "string" ? body.bloodGroup.trim() : "";
    if (!bg) errors.push("Blood group is required.");
    else if (!BLOOD_GROUPS.includes(bg))
      errors.push("Invalid blood group.");
    else data.bloodGroup = bg;
  }

  if (!partial || body.phone !== undefined) {
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : String(body.phone ?? "");
    if (!/^\d{10}$/.test(phone))
      errors.push("Phone must be exactly 10 digits.");
    else data.phone = phone;
  }

  if (!partial || body.city !== undefined) {
    const city = typeof body.city === "string" ? body.city.trim() : "";
    if (!city) errors.push("City is required.");
    else data.city = city;
  }

  if (!partial || body.lastDonationDate !== undefined) {
    if (
      body.lastDonationDate === "" ||
      body.lastDonationDate === null ||
      body.lastDonationDate === undefined
    ) {
      data.lastDonationDate = null;
    } else {
      const d = new Date(body.lastDonationDate);
      if (Number.isNaN(d.getTime()))
        errors.push("Last donation date is invalid.");
      else data.lastDonationDate = d;
    }
  }

  return { errors, data };
}

router.post("/register", async (req, res) => {
  try {
    const { errors, data } = validateDonorBody(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }
    const donor = await Donor.create(data);
    res.status(201).json({
      ok: true,
      message: "Donor registered successfully.",
      donor: donor.toObject(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, errors: ["Server error."] });
  }
});

router.get("/donors", async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;
    const filter = {};
    if (bloodGroup && String(bloodGroup).trim())
      filter.bloodGroup = String(bloodGroup).trim();
    if (city && String(city).trim())
      filter.city = new RegExp(
        String(city).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

    const donors = await Donor.find(filter).sort({ name: 1 }).lean();
    res.json({ ok: true, donors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, errors: ["Server error."] });
  }
});

router.get("/donor/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).lean();
    if (!donor)
      return res.status(404).json({ ok: false, errors: ["Donor not found."] });
    res.json({ ok: true, donor });
  } catch (err) {
    console.error(err);
    res.status(404).json({ ok: false, errors: ["Donor not found."] });
  }
});

router.put("/donor/:id", async (req, res) => {
  try {
    const { errors, data } = validateDonorBody(req.body, { partial: false });
    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }
    const donor = await Donor.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!donor)
      return res.status(404).json({ ok: false, errors: ["Donor not found."] });
    res.json({
      ok: true,
      message: "Donor updated.",
      donor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, errors: ["Server error."] });
  }
});

router.delete("/donor/:id", async (req, res) => {
  try {
    const deleted = await Donor.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ ok: false, errors: ["Donor not found."] });
    res.json({ ok: true, message: "Donor removed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, errors: ["Server error."] });
  }
});

module.exports = router;
