const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../../database/db");
const jwt = require("jsonwebtoken");
const authToken = require("../../middleware/admin/authMiddleware")
const SECRET_KEY = process.env.JWT_SECRET; // from .env

// Register
router.post("/register", async (req, res) => {
  const { name, email, phone, address, logo_url, subscription_plan, password } = req.body;

  try {
    const hashed_password = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO school_user (name, email, phone, address, logo_url, subscription_plan, hashed_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, phone, address, logo_url || null, subscription_plan || null, hashed_password]
    );


    res.status(201).json({ message: "Registration successful", user_id: result.insertId });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM school_user WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);

    res.status(200).json({ message: "Login successful", token: token, user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      logo_url: user.logo_url,
      subscription_plan: user.subscription_plan
    } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
