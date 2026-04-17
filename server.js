require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ ADDED fill
const LocationSchema = new mongoose.Schema({
  deviceId: String,
  type: String,   // "truck" or "bin"
  lat: Number,
  lng: Number,
  fill: Number,   // 🔥 NEW FIELD (0–100)
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', LocationSchema);

// ✅ UPDATED POST
app.post('/location', async (req, res) => {
  try {
    const { deviceId, type, lat, lng, fill } = req.body;  // 🔥 ADD fill

    if (!deviceId || !type || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing data" });
    }

    const result = await Location.create({
      deviceId,
      type,
      lat,
      lng,
      fill: type === "bin" ? (fill ?? 0) : null   // 🔥 STORE fill
    });

    res.json({ ok: true, data: result });

  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// unchanged (good)
app.get('/locations', async (req, res) => {
  try {
    const locations = await Location.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$deviceId",
          latest: { $first: "$$ROOT" }
        }
      }
    ]);

    const result = {};
    locations.forEach(item => {
      result[item._id] = item.latest;
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// keep this
app.delete('/clear', async (req, res) => {
  await Location.deleteMany({});
  res.json({ message: "All data deleted" });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});