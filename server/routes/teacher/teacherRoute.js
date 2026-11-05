const express = require("express");
const router = express.Router();
const teacherModel = require("../../models/teacher/teacher");
const teacherAuthMiddleware = require("../../middleware/teacher/authmiddleware");

// Apply authentication middleware to all routes
router.use(teacherAuthMiddleware);

// Get all students assigned to teacher's classes
router.get("/students", async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const school_id = req.user.school_id;
    
    const filters = {
      class: req.query.class,
      section: req.query.section,
      subject: req.query.subject
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const result = await teacherModel.getTeacherStudents(teacher_id, school_id, filters);
    
    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: result
    });
    
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message
    });
  }
});

// Get students for specific class and subject
router.get("/students/:class/:subject", async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const school_id = req.user.school_id;
    const { class: className, subject } = req.params;
    
    if (!className || !subject) {
      return res.status(400).json({
        success: false,
        message: "Class and subject are required"
      });
    }
    
    const students = await teacherModel.getStudentsByClassAndSubject(
      teacher_id, 
      school_id, 
      className, 
      subject
    );
    
    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: students
    });
    
  } catch (error) {
    console.error("Error fetching students by class and subject:", error);
    
    if (error.message.includes("not authorized")) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: "UNAUTHORIZED_ACCESS"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message
    });
  }
});

// Get teacher's class and subject assignments
router.get("/assignments", async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const school_id = req.user.school_id;
    
    const assignments = await teacherModel.getTeacherAssignments(teacher_id, school_id);
    
    res.status(200).json({
      success: true,
      message: "Teacher assignments retrieved successfully",
      data: assignments
    });
    
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teacher assignments",
      error: error.message
    });
  }
});

// Get teacher profile
router.get("/profile", async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const school_id = req.user.school_id;
    
    const profile = await teacherModel.getTeacherProfile(teacher_id, school_id);
    
    res.status(200).json({
      success: true,
      message: "Teacher profile retrieved successfully",
      data: profile
    });
    
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    
    if (error.message === "Teacher not found") {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
        error: "TEACHER_NOT_FOUND"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teacher profile",
      error: error.message
    });
  }
});

module.exports = router;
