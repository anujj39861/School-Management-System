const express = require('express');
const router = express.Router();
const teacherProfileQueries = require('../../models/teacher/profile');
const db = require('../../database/db');
const teacherAuthMiddleware = require('../../middleware/teacher/authmiddleware');

// Get teacher profile
router.get('/profile', teacherAuthMiddleware, async (req, res) => {
  try {
    const profile = await teacherProfileQueries.getTeacherProfile(db, req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Teacher profile not found'
      });
    }

    // Remove sensitive information
    delete profile.password;

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching profile',
      details: error.message
    });
  }
});

// Update teacher profile
router.put('/profile', teacherAuthMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address, qualification, experience_years, profile_pic_url } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    // Check if email exists for other teachers
    const emailExists = await teacherProfileQueries.checkEmailExists(db, req.user.id, email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists for another teacher'
      });
    }

    // Update profile
    const profileData = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      qualification: qualification || null,
      experience_years: experience_years || 0,
      profile_pic_url: profile_pic_url || null
    };

    const updated = await teacherProfileQueries.updateTeacherProfile(db, req.user.id, profileData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating profile',
      details: error.message
    });
  }
});

// Change password
router.put('/change-password', teacherAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Change password
    const changed = await teacherProfileQueries.changePassword(
      db, 
      req.user.id, 
      currentPassword, 
      newPassword
    );

    if (!changed) {
      return res.status(400).json({
        success: false,
        error: 'Failed to change password'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error changing password',
      details: error.message
    });
  }
});

// Get teacher classes and subjects
router.get('/classes-subjects', teacherAuthMiddleware, async (req, res) => {
  try {
    const data = await teacherProfileQueries.getTeacherClassesAndSubjects(db, req.user.id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Teacher data not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get teacher classes/subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching classes and subjects',
      details: error.message
    });
  }
});

// Get teacher statistics for dashboard
router.get('/stats', teacherAuthMiddleware, async (req, res) => {
  try {
    const stats = await teacherProfileQueries.getTeacherStats(db, req.user.id);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Teacher stats not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching teacher statistics',
      details: error.message
    });
  }
});

// Update last login (called during login)
router.post('/update-last-login', teacherAuthMiddleware, async (req, res) => {
  try {
    const updated = await teacherProfileQueries.updateLastLogin(db, req.user.id);
    
    res.json({
      success: true,
      message: 'Last login updated',
      updated
    });
  } catch (error) {
    console.error('Update last login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating last login',
      details: error.message
    });
  }
});

module.exports = router;
