const bcrypt = require('bcrypt');
const saltRounds = 10;

const teacherQueries = {
  // Generate automatic username in format: [name][mmdd][id]
  generateUsername(name, dob, id) {
    // Clean name: remove spaces, special chars, convert to lowercase
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toLowerCase();
    
    // Extract month and day from DOB
    let monthDay = '';
    if (dob) {
      const date = new Date(dob);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      monthDay = month + day;
    } else {
      // If no DOB provided, use current month and day
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      monthDay = month + day;
    }
    
    // Combine: name + mmdd + id
    return `${cleanName}${monthDay}${id}`;
  },

  // Create a new teacher
  async createTeacher(db, teacherData, school_id) {
    const {
      teacher_id, name, email, password, phone, gender, dob, address, qualification,
      experience_years, subject_specialty, class_assigned,
      profile_pic_url, joining_date, salary, role = 'teacher'
    } = teacherData;

    // Validate required teacher_id
    if (!teacher_id) {
      throw new Error('Teacher ID is required');
    }

    // Check if teacher_id already exists in this school
    const teacherIdExists = await this.checkTeacherIdExists(db, teacher_id, school_id);
    if (teacherIdExists) {
      throw new Error('Teacher ID already exists in this school');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a temporary username (will be updated with actual ID after insert)
    const tempUsername = `temp_${Date.now()}`;

    // Insert teacher with temporary username
    const insertQuery = `
      INSERT INTO teacher (
        teacher_id, name, username, email, password, phone, gender, dob, address, qualification,
        experience_years, subject_specialty, class_assigned, school_id,
        profile_pic_url, joining_date, salary, role, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    const insertValues = [
      teacher_id, name, tempUsername, email, hashedPassword, phone, gender, dob, address, qualification,
      experience_years, subject_specialty, class_assigned, school_id,
      profile_pic_url, joining_date, salary, role
    ];
    
    const [result] = await db.query(insertQuery, insertValues);
    const teacherId = result.insertId;

    // Generate actual username using the database ID
    const username = this.generateUsername(name, dob, teacherId);

    // Update the teacher record with the actual username
    const updateQuery = `
      UPDATE teacher 
      SET username = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await db.query(updateQuery, [username, teacherId]);

    // Return the complete teacher data
    return {
      id: teacherId,
      teacher_id: teacher_id,
      username: username,
      name: name,
      email: email
    };
  },

  // Get all teachers for a specific school
  async getAllTeachers(db, school_id) {
    const query = `
      SELECT id, teacher_id, name, username, email, phone, gender, dob, address, qualification,
             experience_years, subject_specialty, class_assigned, school_id,
             profile_pic_url, joining_date, salary, role, is_active,
             last_login, created_at, updated_at
      FROM teacher
      WHERE school_id = ? 
      ORDER BY created_at DESC
    `;
    const [rows] = await db.query(query, [school_id]);
    return rows;
  },

  // Get teacher by ID for a specific school
  async getTeacherById(db, id, school_id) {
    const query = `
      SELECT id, teacher_id, name, username, email, phone, gender, dob, address, qualification,
             experience_years, subject_specialty, class_assigned, school_id,
             profile_pic_url, joining_date, salary, role, is_active,
             last_login, created_at, updated_at
      FROM teacher
      WHERE id = ? AND school_id = ?
    `;
    const [rows] = await db.query(query, [id, school_id]);
    return rows[0];
  },

  // Update teacher
  async updateTeacher(db, id, teacherData, school_id) {
    const {
      name, email, phone, gender, dob, address, qualification,
      experience_years, subject_specialty, class_assigned,
      profile_pic_url, joining_date, salary, role
    } = teacherData;
    
    // Note: We don't update username or teacher_id as they are auto-generated
    const query = `
      UPDATE teacher
      SET name = ?, email = ?, phone = ?, gender = ?, dob = ?,
          address = ?, qualification = ?, experience_years = ?,
          subject_specialty = ?, class_assigned = ?, 
          profile_pic_url = ?, joining_date = ?, salary = ?, role = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND school_id = ? 
    `;
    const values = [
      name, email, phone, gender, dob, address, qualification,
      experience_years, subject_specialty, class_assigned,
      profile_pic_url, joining_date, salary, role, id, school_id
    ];
    const [result] = await db.query(query, values);
    return result.affectedRows;
  },

  // Delete teacher (hard delete)
  async deleteTeacher(db, id, school_id) {
    const query = `
      DELETE FROM teacher
      WHERE id = ? AND school_id = ? 
    `;
    const [result] = await db.query(query, [id, school_id]);
    return result.affectedRows;
  },

  // Soft delete teacher (set is_active to 0)
  async softDeleteTeacher(db, id, school_id) {
    const query = `
      UPDATE teacher 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND school_id = ? 
    `;
    const [result] = await db.query(query, [id, school_id]);
    return result.affectedRows;
  },

  // Authenticate teacher
  async authenticateTeacher(db, email, password) {
    const query = `
      SELECT id, teacher_id, username, email, password, role, school_id, name
      FROM teacher
      WHERE email = ? AND is_active = 1
    `;
    const [rows] = await db.query(query, [email]);
    if (rows.length === 0) return null;
    const teacher = rows[0];
    const match = await bcrypt.compare(password, teacher.password);
    if (!match) return null;
    await db.query('UPDATE teacher SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [teacher.id]);
    return { 
      id: teacher.id, 
      teacher_id: teacher.teacher_id,
      username: teacher.username,
      name: teacher.name,
      email: teacher.email, 
      role: teacher.role, 
      school_id: teacher.school_id 
    };
  },

  // Check if teacher ID already exists in school
  async checkTeacherIdExists(db, teacher_id, school_id) {
    const query = 'SELECT id FROM teacher WHERE teacher_id = ? AND school_id = ?';
    const [rows] = await db.query(query, [teacher_id, school_id]);
    return rows.length > 0;
  },

  // Check if email already exists
  async checkEmailExists(db, email) {
    const query = 'SELECT id FROM teacher WHERE email = ?';
    const [rows] = await db.query(query, [email]);
    return rows.length > 0;
  }
};

module.exports = teacherQueries;