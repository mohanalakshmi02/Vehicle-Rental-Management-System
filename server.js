
const express = require("express");
const path = require("path");
const db = require("./database/db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
  res.json({ message: "Vehicle Rental System is working!" });
});

app.get("/api/vehicles", (req, res) => {
  const vehicles = db.prepare("SELECT * FROM vehicles").all();
  res.json(vehicles);
});

app.get("/api/vehicles/search", (req, res) => {
  const { location, category } = req.query;

  let sql = "SELECT * FROM vehicles WHERE 1=1";
  const params = [];

  if (location) {
    sql += " AND LOWER(location) LIKE LOWER(?)";
    params.push(`%${location}%`);
  }

  if (category && category.toLowerCase() !== "all") {
    sql += " AND LOWER(type) = LOWER(?)";
    params.push(category);
  }

  const vehicles = db.prepare(sql).all(...params);
  res.json(vehicles);
});

app.post("/api/bookings", (req, res) => {
  try {
    const { vehicleId, pickupDate, returnDate } = req.body;

    if (!vehicleId || !pickupDate || !returnDate) {
      return res.status(400).json({
        error: "Please provide the vehicle and both dates."
      });
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        error: "Return date must be after the pickup date."
      });
    }

    const vehicle = db
      .prepare("SELECT * FROM vehicles WHERE id = ?")
      .get(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found." });
    }

    const conflict = db.prepare(`
      SELECT id FROM bookings
      WHERE vehicle_id = ?
      AND status = 'Confirmed'
      AND pickup_date < ?
      AND return_date > ?
    `).get(vehicleId, returnDate, pickupDate);

    if (conflict) {
      return res.status(409).json({
        error: "This vehicle is already booked for those dates."
      });
    }

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalPrice = days * vehicle.price;

    const booking = db.prepare(`
      INSERT INTO bookings
      (vehicle_id, pickup_date, return_date, total_price, status)
      VALUES (?, ?, ?, ?, 'Confirmed')
    `).run(vehicleId, pickupDate, returnDate, totalPrice);

    res.status(201).json({
      message: "Booking confirmed successfully!",
      bookingId: booking.lastInsertRowid,
      vehicle: vehicle.name,
      pickupDate,
      returnDate,
      days,
      totalPrice,
      status: "Confirmed"
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Unable to create booking." });
  }
});

app.get("/api/bookings", (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT
        bookings.id,
        bookings.vehicle_id AS vehicleId,
        vehicles.name AS vehicle,
        bookings.pickup_date AS pickupDate,
        bookings.return_date AS returnDate,
        bookings.total_price AS totalPrice,
        bookings.status,
        bookings.created_at AS createdAt
      FROM bookings
      JOIN vehicles ON vehicles.id = bookings.vehicle_id
      ORDER BY bookings.id DESC
    `).all();

    res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ error: "Unable to fetch bookings." });
  }
});

app.listen(PORT, () => {
  console.log(`Vehicle Rental System running at http://localhost:${PORT}`);
});
