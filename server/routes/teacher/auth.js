const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const teacherAuthMiddleware = require('../../middleware/teacher/authmiddleware');
const SECRET_KEY = process.env.JWT_SECRET;

// Teacher Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        

        // Get teacher from database
        const [teachers] = await db.execute(
            `SELECT id, teacher_id, name, username, email, phone, gender, 
            qualification, experience_years, subject_specialty, class_assigned, 
            school_id, role, is_active, password, last_login, created_at 
            FROM teacher 
            WHERE username = ? AND is_active = 1`,
            [username]
        );

        // Check if teacher exists
        if (teachers.length === 0) {
            
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const teacher = teachers[0];
        

        // Verify password
        const validPassword = await bcrypt.compare(password, teacher.password);
        if (!validPassword) {
            
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Create JWT token with teacher information
        const token = jwt.sign(
            { 
                id: teacher.id,
                teacher_id: teacher.teacher_id,
                name: teacher.name,
                email: teacher.email,
                username: teacher.username,
                school_id: teacher.school_id,
                role: teacher.role || 'teacher',
                subject_specialty: teacher.subject_specialty,
                class_assigned: teacher.class_assigned
            },
            SECRET_KEY,
             // Token expires in 24 hours
        );

        // Update last login time
        await db.execute(
            'UPDATE teacher SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [teacher.id]
        );

        

        // Send response
        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                teacher: {
                    id: teacher.id,
                    teacher_id: teacher.teacher_id,
                    name: teacher.name,
                    email: teacher.email,
                    username: teacher.username,
                    phone: teacher.phone,
                    gender: teacher.gender,
                    qualification: teacher.qualification,
                    experience_years: teacher.experience_years,
                    subject_specialty: teacher.subject_specialty,
                    class_assigned: teacher.class_assigned,
                    school_id: teacher.school_id,
                    role: teacher.role
                }
            }
        });

    } catch (error) {
        console.error('Teacher Login Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Teacher Registration Route (for admin use)
router.post('/register', async (req, res) => {
    try {
        const { 
            teacher_id, 
            name, 
            username, 
            email, 
            password, 
            phone, 
            gender, 
            dob, 
            address, 
            qualification, 
            experience_years, 
            subject_specialty, 
            class_assigned, 
            school_id, 
            joining_date, 
            salary, 
            role = 'teacher' 
        } = req.body;

        // Validate required fields
        if (!teacher_id || !name || !username || !email || !password || !school_id) {
            return res.status(400).json({
                success: false,
                message: "Required fields: teacher_id, name, username, email, password, school_id"
            });
        }

        

        // Check if teacher already exists
        const [existingTeachers] = await db.execute(
            `SELECT id FROM teacher WHERE email = ? OR (school_id = ? AND teacher_id = ?)`,
            [email, school_id, teacher_id]
        );

        if (existingTeachers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Teacher with this email or teacher ID already exists in this school"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new teacher
        const [result] = await db.execute(
            `INSERT INTO teacher (
                teacher_id, name, username, email, password, phone, gender, 
                dob, address, qualification, experience_years, subject_specialty, 
                class_assigned, school_id, joining_date, salary, role, 
                is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
                teacher_id, name, username, email, hashedPassword, phone || null, 
                gender || null, dob || null, address || null, qualification || null, 
                experience_years || null, subject_specialty || null, class_assigned || null, 
                school_id, joining_date || null, salary || null, role
            ]
        );

        

        res.status(201).json({
            success: true,
            message: "Teacher registration successful",
            data: {
                teacher_id: result.insertId,
                teacher_code: teacher_id,
                name: name,
                email: email
            }
        });

    } catch (error) {
        console.error('Teacher Registration Error:', error);
        
        // Handle specific MySQL errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: "Teacher with this email or teacher ID already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Get Teacher Profile (Protected Route)
router.get('/profile', teacherAuthMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [teachers] = await db.execute(
            `SELECT id, teacher_id, name, username, email, phone, gender, dob, 
            address, qualification, experience_years, subject_specialty, 
            class_assigned, school_id, profile_pic_url, joining_date, 
            role, created_at, last_login 
            FROM teacher 
            WHERE id = ? AND is_active = 1`,
            [teacherId]
        );

        if (teachers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.json({
            success: true,
            data: {
                teacher: teachers[0]
            }
        });

    } catch (error) {
        console.error('Get Teacher Profile Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Update Teacher Profile (Protected Route)
router.put('/profile', teacherAuthMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { 
            phone, 
            address, 
            qualification, 
            experience_years, 
            subject_specialty,
            profile_pic_url 
        } = req.body;

        // Update teacher profile
        await db.execute(
            `UPDATE teacher SET 
            phone = COALESCE(?, phone),
            address = COALESCE(?, address),
            qualification = COALESCE(?, qualification),
            experience_years = COALESCE(?, experience_years),
            subject_specialty = COALESCE(?, subject_specialty),
            profile_pic_url = COALESCE(?, profile_pic_url),
            updated_at = NOW()
            WHERE id = ? AND is_active = 1`,
            [phone, address, qualification, experience_years, subject_specialty, profile_pic_url, teacherId]
        );

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error('Update Teacher Profile Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Change Password (Protected Route)
router.put('/change-password', teacherAuthMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        // Get current password
        const [teachers] = await db.execute(
            'SELECT password FROM teacher WHERE id = ?',
            [teacherId]
        );

        if (teachers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, teachers[0].password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.execute(
            'UPDATE teacher SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedNewPassword, teacherId]
        );

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Logout (Protected Route)
router.post('/logout', teacherAuthMiddleware, async (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        // For now, we'll just send a success response
        res.json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;
