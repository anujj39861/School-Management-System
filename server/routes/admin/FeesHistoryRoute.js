const express = require("express");
const router = express.Router();
const feeHistoryModel = require("../../models/admin/FeesHistory");
const db = require("../../database/db");

// router.post("/", async (req, res) => {
//   try {
//     const result = await feeHistoryModel.logFeeHistory(req.body);
//     res.status(201).json({ message: "Logged successfully", result });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.get("/", async (req, res) => {
  try {
    const history = await db.execute("SELECT * FROM fee_payments_history");
    res.json(history[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
