const express = require('express');
const router = express.Router();
const teacherTimetableQueries = require('../../models/teacher/timetable');
const db = require('../../database/db');
const teacherAuthMiddleware = require('../../middleware/teacher/authmiddleware');

// Get teacher's complete timetable
router.get('/timetable', teacherAuthMiddleware, async (req, res) => {
  try {
    const timetable = await teacherTimetableQueries.getTeacherTimetable(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: timetable,
      count: timetable.length
    });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching timetable',
      details: error.message
    });
  }
});

// Get teacher's timetable for a specific day
router.get('/timetable/day/:day', teacherAuthMiddleware, async (req, res) => {
  try {
    const { day } = req.params;
    
    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day. Must be one of: ' + validDays.join(', ')
      });
    }

    const timetable = await teacherTimetableQueries.getTeacherTimetableByDay(
      db, 
      req.user.id, 
      req.user.school_id, 
      day
    );

    res.json({
      success: true,
      data: timetable,
      day: day,
      count: timetable.length
    });
  } catch (error) {
    console.error('Get teacher timetable by day error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching timetable for the day',
      details: error.message
    });
  }
});

// Get today's timetable
router.get('/timetable/today', teacherAuthMiddleware, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const timetable = await teacherTimetableQueries.getTeacherTimetableByDay(
      db, 
      req.user.id, 
      req.user.school_id, 
      today
    );

    res.json({
      success: true,
      data: timetable,
      day: today,
      count: timetable.length
    });
  } catch (error) {
    console.error('Get today timetable error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching today\'s timetable',
      details: error.message
    });
  }
});

// Get current/next class for dashboard
router.get('/timetable/current', teacherAuthMiddleware, async (req, res) => {
  try {
    const currentClass = await teacherTimetableQueries.getCurrentClass(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: currentClass
    });
  } catch (error) {
    console.error('Get current class error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching current class',
      details: error.message
    });
  }
});

// Get weekly schedule summary
router.get('/timetable/weekly-summary', teacherAuthMiddleware, async (req, res) => {
  try {
    const weeklySchedule = await teacherTimetableQueries.getWeeklySchedule(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: weeklySchedule
    });
  } catch (error) {
    console.error('Get weekly schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching weekly schedule',
      details: error.message
    });
  }
});

// Get all classes taught by teacher
router.get('/classes', teacherAuthMiddleware, async (req, res) => {
  try {
    const classes = await teacherTimetableQueries.getTeacherClasses(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching teacher classes',
      details: error.message
    });
  }
});

// Get teacher's subjects
router.get('/subjects', teacherAuthMiddleware, async (req, res) => {
  try {
    const subjects = await teacherTimetableQueries.getTeacherSubjects(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    console.error('Get teacher subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching teacher subjects',
      details: error.message
    });
  }
});

// Get teaching statistics
router.get('/teaching-stats', teacherAuthMiddleware, async (req, res) => {
  try {
    const stats = await teacherTimetableQueries.getTeachingHours(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get teaching stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching teaching statistics',
      details: error.message
    });
  }
});

// Get free periods for a specific day
router.get('/free-periods/:day', teacherAuthMiddleware, async (req, res) => {
  try {
    const { day } = req.params;
    
    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day. Must be one of: ' + validDays.join(', ')
      });
    }

    const freePeriods = await teacherTimetableQueries.getFreePeriods(
      db, 
      req.user.id, 
      req.user.school_id, 
      day
    );

    res.json({
      success: true,
      data: freePeriods,
      day: day,
      count: freePeriods.length
    });
  } catch (error) {
    console.error('Get free periods error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching free periods',
      details: error.message
    });
  }
});

// Get schedule conflicts
router.get('/timetable/conflicts', teacherAuthMiddleware, async (req, res) => {
  try {
    const conflicts = await teacherTimetableQueries.getScheduleConflicts(
      db, 
      req.user.id, 
      req.user.school_id
    );

    res.json({
      success: true,
      data: conflicts,
      count: conflicts.length,
      hasConflicts: conflicts.length > 0
    });
  } catch (error) {
    console.error('Get schedule conflicts error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching schedule conflicts',
      details: error.message
    });
  }
});

module.exports = router;
