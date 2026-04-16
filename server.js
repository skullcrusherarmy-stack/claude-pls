require('dotenv').config();   // ✅ FIRST LINE
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ FIXED LINE + added proper handling
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const LocationSchema = new mongoose.Schema({
  deviceId: String,
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now }
});
const Location = mongoose.model('Location', LocationSchema);

app.post('/location', async (req, res) => {
  try {
    console.log("BODY:", req.body);  // 👈 ADD THIS

    const { deviceId, lat, lng } = req.body;

    if (!deviceId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing data" });
    }

    const result = await Location.create({ deviceId, lat, lng });

    res.json({ ok: true, data: result });

  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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

app.delete('/clear', async (req, res) => {
  await Location.deleteMany({});
  res.json({ message: "All data deleted" });
});

app.use(express.static('public'));

app.use(express.static('public'));

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Server running');
});