const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error('FATAL: JWT_SECRET missing in environment');
}

function teacherAuthMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "Access Denied - No token provided" 
        });
    }

    try {
        const user = jwt.verify(token, SECRET_KEY);
        
        // Verify that this is a teacher token
        if (user.role !== 'teacher' && user.role !== 'head_teacher') {
            return res.status(403).json({ 
                success: false,
                message: "Access Denied - Invalid role" 
            });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(403).json({ 
            success: false,
            message: "Invalid Token" 
        });
    }
}

module.exports = teacherAuthMiddleware;
