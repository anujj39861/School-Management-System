const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const SECRET_KEY = process.env.JWT_SECRET;

// Student Login Route
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

        // Get student from database
        const [students] = await db.execute(
            `SELECT id, student_id, student_name, class, section, school_id, 
            username, hashed_password, status 
            FROM student 
            WHERE username = ?`,
            [username]
        );

        // Check if student exists
        if (students.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const student = students[0];

        // Check if account is active
        if (student.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact your administrator."
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, student.hashed_password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Create JWT token with role information
        const token = jwt.sign(
            { 
                id: student.id,
                student_id: student.student_id,
                name: student.student_name,
                class: student.class,
                section: student.section,
                school_id: student.school_id,
                username: student.username,
                role: 'student' // Add role information
            },
            SECRET_KEY,
            
        );

        // Update last login time
        await db.execute(
            'UPDATE student SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [student.id]
        );

        // Send response
        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                student: {
                    id: student.id,
                    student_id: student.student_id,
                    name: student.student_name,
                    class: student.class,
                    section: student.section,
                    school_id: student.school_id,
                    username: student.username
                }
            }
        });

    } catch (error) {
        console.error('Student Login Error:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred during login"
        });
    }
});

module.exports = router;
