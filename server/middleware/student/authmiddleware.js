const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error('FATAL: JWT_SECRET missing in environment');
}

function studentAuthMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied" });
    }

    try {
        const user = jwt.verify(token, SECRET_KEY);
        req.user = user;
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid Token" });
    }
}

module.exports = studentAuthMiddleware;
