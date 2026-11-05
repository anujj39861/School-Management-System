const express = require('express');
const router = express.Router();
const studentModel = require('../../models/student/student');
const StudentAttendance = require('../../models/student/attendance');
const studentAuth = require('../../middleware/student/authmiddleware');


router.get('/getstudent/:id', studentAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const student = await studentModel.getStudentById(id);
    res.json({ success: true, message: 'Student retrieved successfully', data: student });
  } catch (err) {
    console.error('Error fetching student:', err.message);
    if (err.message === 'Student not found') {
      return res.status(404).json({ success: false, message: `No student with ID ${req.params.id} found`, error: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to retrieve student', error: err.message });
  }
});

// Update student's password
router.put('/update-password/:id', studentAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be a string with at least 6 characters' });
    }

    // Optional: ensure the requesting student can only update their own password
    if (req.user && req.user.id && String(req.user.id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot update another student\'s password' });
    }

    const result = await studentModel.updatePassword(id, null, newPassword);
    res.json({ success: true, message: 'Password updated successfully', data: result });
  } catch (err) {
    console.error('Error updating password:', err.message);
    if (err.message === 'Student not found') {
      return res.status(404).json({ success: false, message: `No student with ID ${req.params.id} found`, error: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to update password', error: err.message });
  }
});

// Get student's attendance records
router.get('/attendance/:student_id', studentAuth, async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const { subject, start_date, end_date, status, limit } = req.query;
    const school_id = req.user.school_id;

    // Ensure student can only access their own attendance
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance records' 
      });
    }

    const filters = {
      school_id: parseInt(school_id),
      subject,
      start_date,
      end_date,
      status,
      limit
    };

    const attendance = await StudentAttendance.getStudentAttendance(parseInt(student_id), filters);
    res.json({ 
      success: true, 
      message: 'Attendance records retrieved successfully', 
      data: attendance 
    });
  } catch (err) {
    console.error('Error fetching student attendance:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve attendance records', 
      error: err.message 
    });
  }
});

// Get student's attendance statistics
router.get('/attendance-stats/:student_id', studentAuth, async (req, res) => {
  try {
    
    
    const student_id = req.params.student_id;
    const { subject, start_date, end_date } = req.query;
    const school_id = req.user.school_id;

    // Ensure student can only access their own stats
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance statistics' 
      });
    }

    const filters = {
      subject,
      start_date,
      end_date
    };

    
    const stats = await StudentAttendance.getStudentAttendanceStats(parseInt(student_id), parseInt(school_id), filters);
    
    
    res.json({ 
      success: true, 
      message: 'Attendance statistics retrieved successfully', 
      data: stats 
    });
  } catch (err) {
    console.error('Error fetching attendance stats:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve attendance statistics', 
      error: err.message 
    });
  }
});

// Get subject-wise attendance for student
router.get('/subject-wise-attendance/:student_id', studentAuth, async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const { start_date, end_date } = req.query;
    const school_id = req.user.school_id;

    // Ensure student can only access their own data
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance data' 
      });
    }

    const filters = {
      start_date,
      end_date
    };

    const subjectAttendance = await StudentAttendance.getSubjectWiseAttendance(parseInt(student_id), parseInt(school_id), filters);
    res.json({ 
      success: true, 
      message: 'Subject-wise attendance retrieved successfully', 
      data: subjectAttendance 
    });
  } catch (err) {
    console.error('Error fetching subject-wise attendance:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve subject-wise attendance', 
      error: err.message 
    });
  }
});

// Get monthly attendance summary
router.get('/monthly-attendance/:student_id/:year/:month', studentAuth, async (req, res) => {
  try {
    const { student_id, year, month } = req.params;
    const school_id = req.user.school_id;

    // Ensure student can only access their own data
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance data' 
      });
    }

    const monthlyAttendance = await StudentAttendance.getMonthlyAttendance(parseInt(student_id), parseInt(school_id), parseInt(year), parseInt(month));
    res.json({ 
      success: true, 
      message: 'Monthly attendance retrieved successfully', 
      data: monthlyAttendance 
    });
  } catch (err) {
    console.error('Error fetching monthly attendance:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve monthly attendance', 
      error: err.message 
    });
  }
});

// Get recent attendance records
router.get('/recent-attendance/:student_id', studentAuth, async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const { limit = 10 } = req.query;
    const school_id = req.user.school_id;

    // Ensure student can only access their own data
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance data' 
      });
    }

    
    const recentAttendance = await StudentAttendance.getRecentAttendance(parseInt(student_id), parseInt(school_id), parseInt(limit));
    res.json({ 
      success: true, 
      message: 'Recent attendance retrieved successfully', 
      data: recentAttendance 
    });
  } catch (err) {
    console.error('Error fetching recent attendance:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve recent attendance', 
      error: err.message 
    });
  }
});

// Get attendance by date range
router.get('/attendance-range/:student_id', studentAuth, async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const { start_date, end_date } = req.query;
    const school_id = req.user.school_id;

    // Ensure student can only access their own data
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance data' 
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both start_date and end_date are required' 
      });
    }

    const attendanceRange = await StudentAttendance.getAttendanceByDateRange(student_id, school_id, start_date, end_date);
    res.json({ 
      success: true, 
      message: 'Attendance range retrieved successfully', 
      data: attendanceRange 
    });
  } catch (err) {
    console.error('Error fetching attendance range:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve attendance range', 
      error: err.message 
    });
  }
});

// Get attendance percentage for specific subject
router.get('/subject-percentage/:student_id/:subject', studentAuth, async (req, res) => {
  try {
    const { student_id, subject } = req.params;
    const school_id = req.user.school_id;

    // Ensure student can only access their own data
    if (req.user && req.user.id && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only view your own attendance data' 
      });
    }

    const subjectPercentage = await StudentAttendance.getSubjectAttendancePercentage(student_id, school_id, subject);
    res.json({ 
      success: true, 
      message: 'Subject attendance percentage retrieved successfully', 
      data: subjectPercentage 
    });
  } catch (err) {
    console.error('Error fetching subject attendance percentage:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve subject attendance percentage', 
      error: err.message 
    });
  }
});

module.exports = router;
