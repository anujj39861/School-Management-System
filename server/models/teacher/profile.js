const bcrypt = require('bcrypt');
const saltRounds = 10;

const teacherProfileQueries = {
  // Get teacher profile by ID
  async getTeacherProfile(db, teacherId) {
    const query = `
      SELECT id, teacher_id, name, username, email, phone, gender, dob, address, qualification,
             experience_years, subject_specialty, class_assigned, school_id,
             profile_pic_url, joining_date, salary, role, is_active,
             last_login, created_at, updated_at
      FROM teacher
      WHERE id = ? AND is_active = 1
    `;
    const [rows] = await db.query(query, [teacherId]);
    return rows[0];
  },

  // Update teacher profile (basic information only)
  async updateTeacherProfile(db, teacherId, profileData) {
    const {
      name, email, phone, address, qualification, experience_years,
      profile_pic_url
    } = profileData;

    const query = `
      UPDATE teacher 
      SET name = ?, email = ?, phone = ?, address = ?, qualification = ?, 
          experience_years = ?, profile_pic_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `;
    
    const values = [
      name, email, phone, address, qualification, experience_years,
      profile_pic_url, teacherId
    ];
    
    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },

  // Change teacher password
  async changePassword(db, teacherId, currentPassword, newPassword) {
    // First, get the current password hash
    const getPasswordQuery = 'SELECT password FROM teacher WHERE id = ? AND is_active = 1';
    const [rows] = await db.query(getPasswordQuery, [teacherId]);
    
    if (rows.length === 0) {
      throw new Error('Teacher not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateQuery = `
      UPDATE teacher 
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `;
    
    const [result] = await db.query(updateQuery, [hashedNewPassword, teacherId]);
    return result.affectedRows > 0;
  },

  // Update last login timestamp
  async updateLastLogin(db, teacherId) {
    const query = `
      UPDATE teacher 
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `;
    
    const [result] = await db.query(query, [teacherId]);
    return result.affectedRows > 0;
  },

  // Get teacher's classes and subjects
  async getTeacherClassesAndSubjects(db, teacherId) {
    const query = `
      SELECT id, teacher_id, name, subject_specialty, class_assigned, school_id
      FROM teacher
      WHERE id = ? AND is_active = 1
    `;
    const [rows] = await db.query(query, [teacherId]);
    
    if (rows.length > 0) {
      const teacher = rows[0];
      return {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        subject: teacher.subject_specialty,
        classes: teacher.class_assigned ? teacher.class_assigned.split(', ') : [],
        school_id: teacher.school_id
      };
    }
    return null;
  },

  // Check if email exists for other teachers (for profile update validation)
  async checkEmailExists(db, teacherId, email) {
    const query = 'SELECT id FROM teacher WHERE email = ? AND id != ? AND is_active = 1';
    const [rows] = await db.query(query, [email, teacherId]);
    return rows.length > 0;
  },

  // Get teacher statistics (for dashboard)
  async getTeacherStats(db, teacherId) {
    const teacher = await this.getTeacherProfile(db, teacherId);
    if (!teacher) return null;

    const classes = teacher.class_assigned ? teacher.class_assigned.split(', ') : [];
    
    return {
      total_classes: classes.length,
      subject: teacher.subject_specialty,
      experience_years: teacher.experience_years || 0,
      joining_date: teacher.joining_date,
      role: teacher.role
    };
  }
};

module.exports = teacherProfileQueries;
