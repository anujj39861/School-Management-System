const express = require("express");
const router = express.Router();
const attendanceModel = require("../../models/admin/attendance");
const authenticateToken = require("../../middleware/admin/authMiddleware");

// Create attendance record
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const result = await attendanceModel.createAttendance(req.body, school_id);
    res.status(201).json({ 
      success: true, 
      message: "Attendance record created successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error creating attendance:", err);
    
    // Handle specific error cases
    switch(err.message) {
      case "DUPLICATE_ATTENDANCE":
        return res.status(409).json({ 
          success: false, 
          message: "Attendance record already exists for this student, subject, and date.",
          error: "DUPLICATE_ATTENDANCE"
        });
      default:
        if (err.message.includes("Missing required fields")) {
          return res.status(400).json({ 
            success: false, 
            message: "Please fill in all required fields: " + err.message.split(": ")[1],
            error: "MISSING_FIELDS"
          });
        }
        if (err.message.includes("Invalid status")) {
          return res.status(400).json({ 
            success: false, 
            message: "Status must be either 'Present' or 'Absent'",
            error: "INVALID_STATUS"
          });
        }
        if (err.message.includes("Invalid date format")) {
          return res.status(400).json({ 
            success: false, 
            message: "Please enter a valid date (YYYY-MM-DD)",
            error: "INVALID_DATE"
          });
        }
        if (err.message.includes("Student not found")) {
          return res.status(404).json({ 
            success: false, 
            message: "Student not found or does not belong to this school",
            error: "STUDENT_NOT_FOUND"
          });
        }
        if (err.message.includes("Teacher not found")) {
          return res.status(404).json({ 
            success: false, 
            message: "Teacher not found or does not belong to this school",
            error: "TEACHER_NOT_FOUND"
          });
        }
        return res.status(500).json({ 
          success: false, 
          message: "Internal server error occurred while creating attendance record",
          error: "INTERNAL_ERROR"
        });
    }
  }
});

// Bulk create attendance records
router.post("/bulk-create", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const { attendance_records } = req.body;
    
    if (!attendance_records || !Array.isArray(attendance_records)) {
      return res.status(400).json({
        success: false,
        message: "attendance_records array is required",
        error: "INVALID_INPUT"
      });
    }
    
    const result = await attendanceModel.bulkCreateAttendance(attendance_records, school_id);
    
    if (result.error_count > 0) {
      return res.status(207).json({ // 207 Multi-Status
        success: true,
        message: `Bulk attendance creation completed with ${result.success_count} successful and ${result.error_count} failed records`,
        data: result
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: "All attendance records created successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error in bulk attendance creation:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error occurred during bulk attendance creation",
      error: "INTERNAL_ERROR"
    });
  }
});

// Get all attendance records with optional filters
router.get("/", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const filters = {
      student_id: req.query.student_id,
      subject: req.query.subject,
      date: req.query.date,
      status: req.query.status,
      teacher_id: req.query.teacher_id,
      class: req.query.class,
      section: req.query.section,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const result = await attendanceModel.getAttendance(school_id, filters);
    res.status(200).json({ 
      success: true, 
      message: "Attendance records retrieved successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error retrieving attendance:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error occurred while retrieving attendance records",
      error: "INTERNAL_ERROR"
    });
  }
});

// Get attendance statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const filters = {
      student_id: req.query.student_id,
      subject: req.query.subject,
      class: req.query.class,
      section: req.query.section,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const result = await attendanceModel.getAttendanceStats(school_id, filters);
    res.status(200).json({ 
      success: true, 
      message: "Attendance statistics retrieved successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error retrieving attendance stats:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error occurred while retrieving attendance statistics",
      error: "INTERNAL_ERROR"
    });
  }
});

// Get attendance record by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid attendance ID is required",
        error: "INVALID_ID"
      });
    }
    
    const result = await attendanceModel.getAttendanceById(parseInt(id), school_id);
    res.status(200).json({ 
      success: true, 
      message: "Attendance record retrieved successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error retrieving attendance by ID:", err);
    
    if (err.message.includes("not found")) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found",
        error: "NOT_FOUND"
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error occurred while retrieving attendance record",
      error: "INTERNAL_ERROR"
    });
  }
});

// Update attendance record
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid attendance ID is required",
        error: "INVALID_ID"
      });
    }
    
    const result = await attendanceModel.updateAttendance(parseInt(id), req.body, school_id);
    res.status(200).json({ 
      success: true, 
      message: "Attendance record updated successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error updating attendance:", err);
    
    // Handle specific error cases
    switch(err.message) {
      case "DUPLICATE_ATTENDANCE":
        return res.status(409).json({ 
          success: false, 
          message: "Attendance record already exists for this student, subject, and date.",
          error: "DUPLICATE_ATTENDANCE"
        });
      case "Attendance record not found":
        return res.status(404).json({ 
          success: false, 
          message: "Attendance record not found",
          error: "NOT_FOUND"
        });
      case "No fields to update":
        return res.status(400).json({ 
          success: false, 
          message: "No fields provided for update",
          error: "NO_UPDATE_FIELDS"
        });
      default:
        if (err.message.includes("Invalid status")) {
          return res.status(400).json({ 
            success: false, 
            message: "Status must be either 'Present' or 'Absent'",
            error: "INVALID_STATUS"
          });
        }
        if (err.message.includes("Invalid date format")) {
          return res.status(400).json({ 
            success: false, 
            message: "Please enter a valid date (YYYY-MM-DD)",
            error: "INVALID_DATE"
          });
        }
        if (err.message.includes("Student not found")) {
          return res.status(404).json({ 
            success: false, 
            message: "Student not found or does not belong to this school",
            error: "STUDENT_NOT_FOUND"
          });
        }
        if (err.message.includes("Teacher not found")) {
          return res.status(404).json({ 
            success: false, 
            message: "Teacher not found or does not belong to this school",
            error: "TEACHER_NOT_FOUND"
          });
        }
        return res.status(500).json({ 
          success: false, 
          message: "Internal server error occurred while updating attendance record",
          error: "INTERNAL_ERROR"
        });
    }
  }
});

// Delete attendance record
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const school_id = req.user.id;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid attendance ID is required",
        error: "INVALID_ID"
      });
    }
    
    const result = await attendanceModel.deleteAttendance(parseInt(id), school_id);
    res.status(200).json({ 
      success: true, 
      message: "Attendance record deleted successfully", 
      data: result 
    });
  } catch (err) {
    console.error("Error deleting attendance:", err);
    
    if (err.message.includes("not found")) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found",
        error: "NOT_FOUND"
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error occurred while deleting attendance record",
      error: "INTERNAL_ERROR"
    });
  }
});

module.exports = router;
