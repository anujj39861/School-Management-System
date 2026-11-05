const express = require("express");
const router = express.Router();
const schoolUserModel = require("../../models/admin/User_School_Admin");
const authenticateToken = require("../../middleware/admin/authMiddleware");


router.get("/getallusers", authenticateToken, async (req, res) => {
  try {
    const users = await schoolUserModel.getAllSchoolUsers();
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/getuserbyid/:id", authenticateToken, async (req, res) => {
  try {
    const user = await schoolUserModel.getSchoolUserById(req.params.id);

    res.json(user);
  } catch (err) {
  console.error(err)
    
    res.status(500).json({ error: err.message });
  }
});

router.put("/update/:id", authenticateToken, async (req, res) => {
  try {
    const result = await schoolUserModel.updateSchoolUser(req.params.id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await schoolUserModel.getSchoolUserById(req.params.id);
    res.json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    const result = await schoolUserModel.deleteSchoolUser(req.params.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or already deleted" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
