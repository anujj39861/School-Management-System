const express = require('express');
const router = express.Router();
const StudentTimetable = require('../../models/student/timetable');
const authenticateToken = require('../../middleware/student/authmiddleware');

// Get student's complete timetable
router.get('/my-timetable', authenticateToken, async (req, res) => {
  try {
  const studentId = req.user.id;
    
    const timetableData = await StudentTimetable.getStudentTimetable(studentId);
    
    res.json({
      success: true,
      message: 'Timetable retrieved successfully',
      data: timetableData
    });
  } catch (error) {
    console.error('Error in GET /my-timetable:', error.message);
    
    if (error.message === 'Student not found') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student record not found' 
      });
    }
    
    if (error.message === 'Student school information is incomplete') {
      return res.status(400).json({ 
        success: false, 
        message: 'Your school information is incomplete. Please contact your administrator.' 
      });
    }
    
    if (error.message.includes('No timetable available for your class')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message === 'No timetables available for your school') {
      return res.status(404).json({ 
        success: false, 
        message: 'No timetables have been created for your school yet. Please contact your administrator.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve timetable. Please try again later.' 
    });
  }
});

// Get today's schedule
router.get('/today-schedule', authenticateToken, async (req, res) => {
  try {
  const studentId = req.user.id;
    
    const todaySchedule = await StudentTimetable.getTodaySchedule(studentId);
    
    res.json({
      success: true,
      message: "Today's schedule retrieved successfully",
      data: todaySchedule
    });
  } catch (error) {
    console.error("Error in GET /today-schedule:", error.message);
    
    if (error.message === 'Student not found') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student record not found' 
      });
    }
    
    if (error.message === 'Student school information is incomplete') {
      return res.status(400).json({ 
        success: false, 
        message: 'Your school information is incomplete. Please contact your administrator.' 
      });
    }
    
    if (error.message.includes('No timetable available for your class')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message === 'No timetables available for your school') {
      return res.status(404).json({ 
        success: false, 
        message: 'No timetables have been created for your school yet.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve today's schedule. Please try again later." 
    });
  }
});

// Get next class information
router.get('/next-class', authenticateToken, async (req, res) => {
  try {
  const studentId = req.user.id;
    
    const nextClassInfo = await StudentTimetable.getNextClass(studentId);
    
    res.json({
      success: true,
      message: 'Next class information retrieved successfully',
      data: nextClassInfo
    });
  } catch (error) {
    console.error('Error in GET /next-class:', error.message);
    
    if (error.message === 'Student not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'Student record not found' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve next class information' 
    });
  }
});

// Get class information for student
router.get('/class-info', authenticateToken, async (req, res) => {
  try {
  const studentId = req.user.id;
    
    const classInfo = await StudentTimetable.getStudentClass(studentId);
    
    res.json({
      success: true,
      message: 'Class information retrieved successfully',
      data: classInfo
    });
  } catch (error) {
    console.error('Error in GET /class-info:', error.message);
    
    if (error.message === 'Student not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'Student record not found' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve class information' 
    });
  }
});

module.exports = router;
