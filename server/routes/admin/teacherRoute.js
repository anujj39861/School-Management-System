const express = require('express');
const router = express.Router();
const teacherQueries = require('../../models/admin/teacher');
const authenticateToken = require('../../middleware/admin/authMiddleware');
const db = require('../../database/db');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // Ensure this matches your middleware

// Middleware for input validation
const validateTeacherData = (req, res, next) => {
  const { name, email, password, teacher_id } = req.body;
  if (req.method === 'POST' && (!name || !email || !password || !teacher_id)) {
    return res.status(400).json({ 
      success: false,
      error: 'Name, email, password, and teacher_id are required for teacher creation' 
    });
  }
  if (req.method === 'PUT' && (!name || !email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Name and email are required for teacher update' 
    });
  }
  next();
};

// Create a new teacher (protected)
router.post('/create', authenticateToken, validateTeacherData, async (req, res) => {
  try {
    // Check if email already exists
    const emailExists = await teacherQueries.checkEmailExists(db, req.body.email);
    if (emailExists) {
      return res.status(409).json({ 
        success: false,
        error: 'A teacher with this email already exists' 
      });
    }

    // Check if teacher_id already exists in this school
    const teacherIdExists = await teacherQueries.checkTeacherIdExists(db, req.body.teacher_id, req.user.id);
    if (teacherIdExists) {
      return res.status(409).json({ 
        success: false,
        error: 'A teacher with this Teacher ID already exists in your school' 
      });
    }

    const teacherData = await teacherQueries.createTeacher(db, req.body, req.user.id);
    
    res.status(201).json({ 
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: teacherData.id,
        teacher_id: teacherData.teacher_id,
        username: teacherData.username,
        name: teacherData.name,
        email: teacherData.email
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false,
        error: 'Teacher with this email or teacher ID already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error creating teacher', 
      details: error.message 
    });
  }
});

// Get all teachers for the authenticated school (protected) - root endpoint
router.get('/', authenticateToken, async (req, res) => {
  try {
    const teachers = await teacherQueries.getAllTeachers(db, req.user.id);
    res.json({
      success: true,
      data: teachers,
      count: teachers.length
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching teachers', 
      details: error.message 
    });
  }
});

// Get all teachers for the authenticated school (protected)
router.get('/getALL', authenticateToken, async (req, res) => {
  try {
    const teachers = await teacherQueries.getAllTeachers(db, req.user.id);
    res.json({
      success: true,
      data: teachers,
      count: teachers.length
    });
  } catch (error) {
    console.error('Fetch all teachers error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching teachers', 
      details: error.message 
    });
  }
});

// Get teacher by ID for the authenticated school (protected)
router.get('/get/:id', authenticateToken, async (req, res) => {
  try {
    const teacher = await teacherQueries.getTeacherById(db, req.params.id, req.user.id);
    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        error: 'Teacher not found or not in your school' 
      });
    }
    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error(`Fetch teacher id=${req.params.id} error:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching teacher', 
      details: error.message 
    });
  }
});

// Update teacher (protected)
router.put('/update/:id', authenticateToken, validateTeacherData, async (req, res) => {
  try {
    // Check if email exists for other teachers (excluding current teacher)
    const [existingTeachers] = await db.query(
      'SELECT id FROM teacher WHERE email = ? AND id != ?',
      [req.body.email, req.params.id]
    );
    
    if (existingTeachers.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Another teacher with this email already exists' 
      });
    }

    const affectedRows = await teacherQueries.updateTeacher(db, req.params.id, req.body, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Teacher not found or not in your school' 
      });
    }
    res.json({ 
      success: true,
      message: 'Teacher updated successfully' 
    });
  } catch (error) {
    console.error(`Update teacher id=${req.params.id} error:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating teacher', 
      details: error.message 
    });
  }
});

// Delete teacher (hard delete, protected)
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const affectedRows = await teacherQueries.deleteTeacher(db, req.params.id, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Teacher not found or not in your school' 
      });
    }
    res.json({ 
      success: true,
      message: 'Teacher deleted successfully' 
    });
  } catch (error) {
    console.error(`Delete teacher id=${req.params.id} error:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting teacher', 
      details: error.message 
    });
  }
});

// Soft delete teacher (deactivate, protected)
router.put('/deactivate/:id', authenticateToken, async (req, res) => {
  try {
    const affectedRows = await teacherQueries.softDeleteTeacher(db, req.params.id, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Teacher not found or not in your school' 
      });
    }
    res.json({ 
      success: true,
      message: 'Teacher deactivated successfully' 
    });
  } catch (error) {
    console.error(`Deactivate teacher id=${req.params.id} error:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error deactivating teacher', 
      details: error.message 
    });
  }
});

// Generate username preview (for admin to see what username will be generated)
router.post('/preview-username', authenticateToken, async (req, res) => {
  try {
    const { name, dob } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Name is required to generate username preview' 
      });
    }

    // Use a temporary ID for preview (actual ID will be used during creation)
    const tempId = 999;
    const username = teacherQueries.generateUsername(name, dob, tempId);
    
    res.json({
      success: true,
      data: {
        preview_username: username.replace('999', '[ID]'), // Show placeholder for actual ID
        format_explanation: 'Username format: [name][mmdd][database_id]',
        note: 'The [ID] will be replaced with the actual database ID when teacher is created'
      }
    });
  } catch (error) {
    console.error('Generate username preview error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error generating username preview', 
      details: error.message 
    });
  }
});

// File upload endpoint (protected)
// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: './Uploads/',
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });
// const upload = multer({ storage });

// router.post('/upload', authenticateToken, upload.single('profilePic'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//     const fileUrl = `/Uploads/${req.file.filename}`;
//     res.json({ profile_pic_url: fileUrl });
//   } catch (error) {
//     console.error('File upload error:', error);
//     res.status(500).json({ error: 'Error uploading file', details: error.message });
//   }
// });

// Teacher login (public)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const teacher = await teacherQueries.authenticateTeacher(db, email, password);
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: teacher.id, email: teacher.email, role: teacher.role, school_id: teacher.school_id },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Login successful', token, teacher: { id: teacher.id, email: teacher.email, role: teacher.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login', details: error.message });
  }
});

module.exports = router;