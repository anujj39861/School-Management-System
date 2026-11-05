const express = require("express");
const router = express.Router();
const feesModel = require("../../models/admin/Fees");
const authenticateToken = require("../../middleware/admin/authMiddleware");

// Create fee
router.post("/createfees", authenticateToken, async (req, res) => {
  try {
  const school_id = req.user.id;
    const result = await feesModel.createFee(req.body, school_id);
    res.status(201).json({
      success: true,
      status: 201,
      message: "Fee created successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Get all fees
router.get("/getallfees", authenticateToken, async (req, res) => {
  try {
    const fees = await feesModel.getAllFees();
    res.status(200).json({
      success: true,
      status: 200,
      message: "Fees fetched successfully",
      data: fees,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: "Error fetching fees",
      error: err.message,
    });
  }
});

// Get fee by student - id and school_id

router.get("/getfees/:id", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const fee = await feesModel.getFeeById(req.params.id, school_id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Fee not found",
      });
    }
    res.status(200).json({
      success: true,
      status: 200,
      message: "Fee fetched successfully",
      data: fee,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: "Error fetching fee",
      error: err.message,
    });
  }
});

// Update fee here i am using actual id of fees row not student -id
router.put("/updatefees/:id",authenticateToken, async (req, res) => {
  try {
    const result = await feesModel.updateFee(req.params.id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Fee not found or nothing to update",
      });
    }
    res.status(200).json({
      success: true,
      status: 200,
      message: "Fee updated successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: "Error updating fee",
      error: err.message,
    });
  }
});

// Delete fee
router.delete("/deletefees/:id", authenticateToken, async (req, res) => {
  try {
    const result = await feesModel.deleteFee(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Fee not found or already deleted",
      });
    }
    res.status(200).json({
      success: true,
      status: 200,
      message: "Fee deleted successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: "Error deleting fee",
      error: err.message,
    });
  }
});

module.exports = router;
