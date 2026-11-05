const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const teacherAuthMiddleware = require('../../middleware/teacher/authmiddleware');
const teacherAttendanceQueries = require('../../models/teacher/attendance');

// Middleware to authenticate teacher for all routes
router.use(teacherAuthMiddleware);
 
// Mark attendance for a single student
router.post('/mark', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    
    const { student_id, class_id, subject, date, status } = req.body;

    // Validate required fields
    if (!student_id || !class_id || !subject || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, class_id, subject, date, status'
      });
    }

    // Validate status
    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Present or Absent'
      });
    }

    // Validate date format
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Don't allow future dates
    const today = new Date();
    const attendanceDate = new Date(date);
    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future dates'
      });
    }

    const result = await teacherAttendanceQueries.markAttendance(db, teacherId, schoolId, {
      student_id,
      class_id,
      subject,
      date,
      status
    });

    res.status(200).json({
      success: true,
      message: `Attendance ${result.action} successfully`,
      data: result
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    
    if (error.message.includes('not authorized') || 
        error.message.includes('not found') ||
        error.message.includes('Invalid') ||
        error.message.includes('Missing')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while marking attendance'
    });
  }
});

// Mark attendance for multiple students (bulk) - Alternative endpoint for frontend compatibility
router.post('/bulk-mark', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    
    const { attendance_records } = req.body;

    // Validate required fields
    if (!attendance_records || !Array.isArray(attendance_records) || attendance_records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendance_records must be a non-empty array'
      });
    }

    // Extract common data from first record for validation
    const firstRecord = attendance_records[0];
    const { class_id, subject, date } = firstRecord;

    if (!class_id || !subject || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields in attendance records: class_id, subject, date'
      });
    }

    // Validate date format
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Don't allow future dates
    const today = new Date();
    const attendanceDate = new Date(date);
    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future dates'
      });
    }

    // Validate each attendance record
    for (const record of attendance_records) {
      if (!record.student_id || !record.status) {
        return res.status(400).json({
          success: false,
          message: 'Each attendance record must have student_id and status'
        });
      }
      
      if (!['Present', 'Absent'].includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status "${record.status}" for student ${record.student_id}. Must be Present or Absent`
        });
      }
    }

    const result = await teacherAttendanceQueries.markBulkAttendance(db, teacherId, schoolId, {
      class_id,
      subject,
      date,
      attendance_records
    });

    res.status(200).json({
      success: true,
      message: `Bulk attendance processed: ${result.successful_count} successful, ${result.error_count} errors`,
      data: result
    });

  } catch (error) {
    console.error('Error marking bulk attendance:', error);
    
    // Handle specific error types with proper status codes
    if (error.message.includes('not authorized') || 
        error.message.includes('Invalid') ||
        error.message.includes('already been marked') ||
        error.message.includes('once per day')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Handle not found errors
    if (error.message.includes('Teacher not found') ||
        error.message.includes('Student not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    // Generic server error (avoid exposing internal details)
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while saving attendance. Please try again.'
    });
  }
});

// Mark attendance for multiple students (bulk)
router.post('/mark-bulk', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    
    const { class_id, subject, date, attendance_records } = req.body;

    // Validate required fields
    if (!class_id || !subject || !date || !attendance_records) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: class_id, subject, date, attendance_records'
      });
    }

    if (!Array.isArray(attendance_records) || attendance_records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendance_records must be a non-empty array'
      });
    }

    // Validate date format
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Don't allow future dates
    const today = new Date();
    const attendanceDate = new Date(date);
    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future dates'
      });
    }

    // Validate each attendance record
    for (const record of attendance_records) {
      if (!record.student_id || !record.status) {
        return res.status(400).json({
          success: false,
          message: 'Each attendance record must have student_id and status'
        });
      }
      
      if (!['Present', 'Absent'].includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status "${record.status}" for student ${record.student_id}. Must be Present or Absent`
        });
      }
    }

    const result = await teacherAttendanceQueries.markBulkAttendance(db, teacherId, schoolId, {
      class_id,
      subject,
      date,
      attendance_records
    });

    res.status(200).json({
      success: true,
      message: `Bulk attendance processed: ${result.successful_count} successful, ${result.error_count} errors`,
      data: result
    });

  } catch (error) {
    console.error('Error marking bulk attendance:', error);
    
    if (error.message.includes('not authorized') || 
        error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while marking bulk attendance'
    });
  }
});

// Get attendance records for teacher's classes
router.get('/records', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    
    const filters = {};
    
    // Extract query parameters for filtering
    if (req.query.class_id) filters.class_id = req.query.class_id;
    if (req.query.subject) filters.subject = req.query.subject;
    if (req.query.date) filters.date = req.query.date;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.student_id) filters.student_id = req.query.student_id;

    const records = await teacherAttendanceQueries.getTeacherAttendance(db, teacherId, schoolId, filters);

    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: records,
      count: records.length
    });

  } catch (error) {
    console.error('Error getting attendance records:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving attendance records'
    });
  }
});

// Get students in a specific class for attendance marking
router.get('/students/:class_id/:subject', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    const { class_id, subject } = req.params;

    if (!class_id || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and subject are required'
      });
    }

    const students = await teacherAttendanceQueries.getClassStudents(db, teacherId, schoolId, class_id, subject);

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: students,
      count: students.length
    });

  } catch (error) {
    console.error('Error getting class students:', error);
    
    if (error.message.includes('not authorized')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving students'
    });
  }
});

// Get attendance statistics
router.get('/stats', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    
    const filters = {};
    
    // Extract query parameters for filtering
    if (req.query.class_id) filters.class_id = req.query.class_id;
    if (req.query.subject) filters.subject = req.query.subject;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.date) filters.date = req.query.date;

    const stats = await teacherAttendanceQueries.getAttendanceStats(db, teacherId, schoolId, filters);

    res.status(200).json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving statistics'
    });
  }
});

// Get attendance statistics
router.get('/statistics', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    
    const filters = {};
    
    // Extract query parameters for filtering
    if (req.query.class_id) filters.class_id = req.query.class_id;
    if (req.query.subject) filters.subject = req.query.subject;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const stats = await teacherAttendanceQueries.getAttendanceStats(db, teacherId, schoolId, filters);

    res.status(200).json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving statistics'
    });
  }
});

// Get today's attendance for dashboard
router.get('/today', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;

    const todayAttendance = await teacherAttendanceQueries.getTodayAttendance(db, teacherId, schoolId);

    res.status(200).json({
      success: true,
      message: "Today's attendance retrieved successfully",
      data: todayAttendance,
      count: todayAttendance.length
    });

  } catch (error) {
    console.error("Error getting today's attendance:", error);
    
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving today's attendance"
    });
  }
});

// Get attendance for a specific student in teacher's classes
router.get('/student/:student_id', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    const { student_id } = req.params;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const filters = { student_id };
    
    // Additional filters from query params
    if (req.query.subject) filters.subject = req.query.subject;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const attendance = await teacherAttendanceQueries.getTeacherAttendance(db, teacherId, schoolId, filters);

    res.status(200).json({
      success: true,
      message: 'Student attendance retrieved successfully',
      data: attendance,
      count: attendance.length
    });

  } catch (error) {
    console.error('Error getting student attendance:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving student attendance'
    });
  }
});

// Get class attendance statistics with student percentages
router.get('/class-stats/:class/:subject', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.school_id;
    const { class: classSpec, subject } = req.params;

    // Validate required parameters
    if (!classSpec || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: class and subject'
      });
    }

    // Optional date range filters
    const dateRange = {};
    if (req.query.start_date) dateRange.start_date = req.query.start_date;
    if (req.query.end_date) dateRange.end_date = req.query.end_date;

    const stats = await teacherAttendanceQueries.getClassAttendanceStats(
      db, 
      teacherId, 
      schoolId, 
      classSpec, 
      subject, 
      dateRange
    );

    res.status(200).json({
      success: true,
      message: 'Class attendance statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error getting class attendance stats:', error);
    
    if (error.message.includes('not authorized') || 
        error.message.includes('Invalid') ||
        error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving class attendance statistics'
    });
  }
});

module.exports = router;
