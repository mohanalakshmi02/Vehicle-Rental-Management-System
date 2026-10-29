
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(__dirname, "vehicle-rental.db")
);

// Create the vehicles table
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    seats INTEGER NOT NULL,
    fuel TEXT NOT NULL,
    price REAL NOT NULL,
    location TEXT NOT NULL,
    image TEXT
  );
`);

// Create the bookings table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    pickup_date TEXT NOT NULL,
    return_date TEXT NOT NULL,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
`);

// Add sample vehicles only if the table is empty
const vehicleCount = db
  .prepare("SELECT COUNT(*) AS count FROM vehicles")
  .get();

if (vehicleCount.count === 0) {
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles
      (id, name, type, seats, fuel, price, location, image)
    VALUES
      (@id, @name, @type, @seats, @fuel, @price, @location, @image)
  `);

  const vehicles = [
    {
      id: 1,
      name: "Hyundai Creta",
      type: "SUV",
      seats: 5,
      fuel: "Petrol",
      price: 2500,
      location: "Chennai",
      image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      name: "Honda City",
      type: "Sedan",
      seats: 5,
      fuel: "Petrol",
      price: 2000,
      location: "Chennai",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      name: "Maruti Swift",
      type: "Hatchback",
      seats: 5,
      fuel: "Petrol",
      price: 1200,
      location: "Bengaluru",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      name: "Toyota Fortuner",
      type: "SUV",
      seats: 7,
      fuel: "Diesel",
      price: 4000,
      location: "Bengaluru",
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const insertMany = db.transaction(items => {
    for (const vehicle of items) {
      insertVehicle.run(vehicle);
    }
  });

  insertMany(vehicles);
}

module.exports = db;
