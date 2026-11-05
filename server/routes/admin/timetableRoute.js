const express = require('express');
const router = express.Router();
const Timetable = require('../../models/admin/timetable');
const authenticateToken = require('../../middleware/admin/authMiddleware');

// Get all classes for the authenticated school
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const schoolId = req.user.id;
    
    const classes = await Timetable.getAllClasses(schoolId);
    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      data: classes
    });
  } catch (error) {
    console.error('Error in GET /classes:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get timetable for a specific class
router.get('/timetable/:classId', authenticateToken, async (req, res) => {
  try {
    const schoolId = req.user.id;
    
    const timetable = await Timetable.getTimetableByClass(schoolId, req.params.classId);
    res.json({
      success: true,
      message: 'Timetable retrieved successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Error in GET /timetable/:classId:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
});

// Create a new class with its timetable
router.post('/create', authenticateToken, async (req, res) => {
  const { classId, className, schoolDays, timetable } = req.body;
  const schoolId = req.user.id;
  
  if (!classId || !className || !schoolDays || !Array.isArray(schoolDays) || !timetable) {
    console.error('Invalid input for create class:', { classId, className, schoolDays, timetable });
    return res.status(400).json({
      success: false,
      error: 'Invalid input: classId, className, schoolDays (array), and timetable are required'
    });
  }
  try {
    const result = await Timetable.createClass(schoolId, classId, className, schoolDays, timetable);
    
    res.status(201).json({
      success: true,
      message: 'Class and timetable created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating class:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update a single timetable slot
router.post('/create/slot', authenticateToken, async (req, res) => {
  const { classId, className, schoolDays, day, timeSlot, subject, teacher, room } = req.body;
  const schoolId = req.user.id;
  
  if (!classId || !className || !schoolDays || !Array.isArray(schoolDays) || !day || !timeSlot) {
    console.error('Invalid input for create slot:', { classId, className, schoolDays, day, timeSlot });
    return res.status(400).json({
      success: false,
      error: 'Invalid input: classId, className, schoolDays (array), day, and timeSlot are required'
    });
  }
  try {
    await Timetable.createOrUpdateSlot(schoolId, classId, className, schoolDays, day, timeSlot, subject, teacher, room);
    res.status(201).json({
      success: true,
      message: 'Timetable slot created/updated successfully',
      data: { classId, day, timeSlot }
    });
  } catch (error) {
    console.error('Error creating/updating slot:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update entire timetable for a class
router.put('/update/:classId', authenticateToken, async (req, res) => {
  const { schoolDays, timetable } = req.body;
  const schoolId = req.user.id;
  const classId = req.params.classId;
  
  if (!schoolDays || !Array.isArray(schoolDays) || !timetable) {
    console.error('Invalid input for update timetable:', { schoolDays, timetable });
    return res.status(400).json({
      success: false,
      error: 'Invalid input: schoolDays (array) and timetable are required'
    });
  }
  try {
    await Timetable.updateTimetable(schoolId, classId, schoolDays, timetable);
    res.json({
      success: true,
      message: 'Timetable updated successfully',
      data: { classId }
    });
  } catch (error) {
    console.error('Error updating timetable:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a specific timetable slot
router.delete('/delete/slot', authenticateToken, async (req, res) => {
  const { classId, day, timeSlot } = req.body;
  const schoolId = req.user.id;
  
  if (!classId || !day || !timeSlot) {
    console.error('Invalid input for delete slot:', { classId, day, timeSlot });
    return res.status(400).json({
      success: false,
      error: 'Invalid input: classId, day, and timeSlot are required'
    });
  }
  try {
    await Timetable.deleteSlot(schoolId, classId, day, timeSlot);
    res.json({
      success: true,
      message: 'Timetable slot deleted successfully',
      data: { classId, day, timeSlot }
    });
  } catch (error) {
    console.error('Error deleting slot:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete an entire class timetable
router.delete('/delete/:classId', authenticateToken, async (req, res) => {
  const schoolId = req.user.id;
  const classId = req.params.classId;
  
  try {
    await Timetable.deleteClass(schoolId, classId);
    res.json({
      success: true,
      message: 'Class timetable deleted successfully',
      data: { classId }
    });
  } catch (error) {
    console.error('Error deleting class:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;