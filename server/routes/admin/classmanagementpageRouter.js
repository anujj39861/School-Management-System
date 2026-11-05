const express = require('express');
const router = express.Router();
const ClassManagement = require('./classmanagementpage');
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.school_id = decoded.school_id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.post('/', authMiddleware, async (req, res) => {
    try {
        const classData = { ...req.body, school_id: req.school_id };
        const newClass = await ClassManagement.createClass(classData);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const classes = await ClassManagement.getAllClasses(req.school_id);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const classData = await ClassManagement.getClassById(req.params.id, req.school_id);
        if (!classData) return res.status(404).json({ error: 'Class not found' });
        res.json(classData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const success = await ClassManagement.updateClass(req.params.id, req.body, req.school_id);
        if (!success) return res.status(404).json({ error: 'Class not found' });
        res.json({ message: 'Class updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const success = await ClassManagement.deleteClass(req.params.id, req.school_id);
        if (!success) return res.status(404).json({ error: 'Class not found' });
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;