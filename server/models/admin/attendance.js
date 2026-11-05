const db = require("../../database/db");
const bcrypt = require('bcryptjs');

// Create attendance record
async function createAttendance(data, school_id) {
  try {
    const { student_id, subject, date, status, teacher_id } = data;

    // Validate required fields
    const requiredFields = { student_id, subject, date, status, teacher_id };
    const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Validate status enum
    if (!['Present', 'Absent'].includes(status)) {
      throw new Error("Invalid status. Status must be 'Present' or 'Absent'");
    }

    // Validate date format (YYYY-MM-DD)
    if (date && isNaN(Date.parse(date))) {
      throw new Error("Invalid date format, use YYYY-MM-DD");
    }

    // Check if attendance record already exists for this student, subject, and date
    const checkQuery = `
      SELECT id FROM attendance 
      WHERE student_id = ? AND subject = ? AND date = ? AND school_id = ?
    `;
    const [existingRecord] = await db.execute(checkQuery, [student_id, subject, date, school_id]);
    
    if (existingRecord.length > 0) {
      throw new Error("DUPLICATE_ATTENDANCE");
    }

    // Verify student exists and belongs to the school
    const studentQuery = `
      SELECT id FROM student WHERE id = ? AND school_id = ?
    `;
    const [studentCheck] = await db.execute(studentQuery, [student_id, school_id]);
    
    if (studentCheck.length === 0) {
      throw new Error("Student not found or does not belong to this school");
    }

    // Verify teacher exists and belongs to the school
    const teacherQuery = `
      SELECT id FROM teacher WHERE id = ? AND school_id = ?
    `;
    const [teacherCheck] = await db.execute(teacherQuery, [teacher_id, school_id]);
    
    if (teacherCheck.length === 0) {
      throw new Error("Teacher not found or does not belong to this school");
    }

    // Insert attendance record
    const insertQuery = `
      INSERT INTO attendance (student_id, school_id, subject, date, status, teacher_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(insertQuery, [
      student_id, school_id, subject, date, status, teacher_id
    ]);

    return {
      id: result.insertId,
      student_id,
      school_id,
      subject,
      date,
      status,
      teacher_id,
      message: "Attendance record created successfully"
    };

  } catch (error) {
    console.error("Error in createAttendance:", error);
    throw error;
  }
}

// Get all attendance records for a school with optional filters
async function getAttendance(school_id, filters = {}) {
  try {
    let query = `
      SELECT 
        a.id,
        a.student_id,
        a.subject,
        a.date,
        a.status,
        a.teacher_id,
        a.created_at,
        a.updated_at,
        s.student_name,
        s.class,
        s.section,
        t.name as teacher_name
      FROM attendance a
      LEFT JOIN student s ON a.student_id = s.id
      LEFT JOIN teacher t ON a.teacher_id = t.id
      WHERE a.school_id = ?
    `;
    
    const queryParams = [school_id];
    
    // Add filters
    if (filters.student_id) {
      query += " AND a.student_id = ?";
      queryParams.push(filters.student_id);
    }
    
    if (filters.subject) {
      query += " AND a.subject LIKE ?";
      queryParams.push(`%${filters.subject}%`);
    }
    
    if (filters.date) {
      query += " AND a.date = ?";
      queryParams.push(filters.date);
    }
    
    if (filters.status) {
      query += " AND a.status = ?";
      queryParams.push(filters.status);
    }
    
    if (filters.teacher_id) {
      query += " AND a.teacher_id = ?";
      queryParams.push(filters.teacher_id);
    }
    
    if (filters.class) {
      query += " AND s.class = ?";
      queryParams.push(filters.class);
    }
    
    if (filters.section) {
      query += " AND s.section = ?";
      queryParams.push(filters.section);
    }
    
    // Add date range filters
    if (filters.start_date) {
      query += " AND a.date >= ?";
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += " AND a.date <= ?";
      queryParams.push(filters.end_date);
    }
    
    query += " ORDER BY a.date DESC, s.student_name ASC";
    
    const [rows] = await db.execute(query, queryParams);
    return rows;

  } catch (error) {
    console.error("Error in getAttendance:", error);
    throw error;
  }
}

// Get attendance by ID
async function getAttendanceById(id, school_id) {
  try {
    const query = `
      SELECT 
        a.id,
        a.student_id,
        a.subject,
        a.date,
        a.status,
        a.teacher_id,
        a.created_at,
        a.updated_at,
        s.student_name,
        s.class,
        s.section,
        t.name as teacher_name
      FROM attendance a
      LEFT JOIN student s ON a.student_id = s.id
      LEFT JOIN teacher t ON a.teacher_id = t.id
      WHERE a.id = ? AND a.school_id = ?
    `;
    
    const [rows] = await db.execute(query, [id, school_id]);
    
    if (rows.length === 0) {
      throw new Error("Attendance record not found");
    }
    
    return rows[0];

  } catch (error) {
    console.error("Error in getAttendanceById:", error);
    throw error;
  }
}

// Update attendance record
async function updateAttendance(id, data, school_id) {
  try {
    const { student_id, subject, date, status, teacher_id } = data;

    // Validate status enum if provided
    if (status && !['Present', 'Absent'].includes(status)) {
      throw new Error("Invalid status. Status must be 'Present' or 'Absent'");
    }

    // Validate date format if provided
    if (date && isNaN(Date.parse(date))) {
      throw new Error("Invalid date format, use YYYY-MM-DD");
    }

    // Check if attendance record exists and belongs to the school
    const checkQuery = `
      SELECT id FROM attendance WHERE id = ? AND school_id = ?
    `;
    const [existingRecord] = await db.execute(checkQuery, [id, school_id]);
    
    if (existingRecord.length === 0) {
      throw new Error("Attendance record not found");
    }

    // If updating student_id, verify student exists and belongs to the school
    if (student_id) {
      const studentQuery = `
        SELECT id FROM student WHERE id = ? AND school_id = ?
      `;
      const [studentCheck] = await db.execute(studentQuery, [student_id, school_id]);
      
      if (studentCheck.length === 0) {
        throw new Error("Student not found or does not belong to this school");
      }
    }

    // If updating teacher_id, verify teacher exists and belongs to the school
    if (teacher_id) {
      const teacherQuery = `
        SELECT id FROM teacher WHERE id = ? AND school_id = ?
      `;
      const [teacherCheck] = await db.execute(teacherQuery, [teacher_id, school_id]);
      
      if (teacherCheck.length === 0) {
        throw new Error("Teacher not found or does not belong to this school");
      }
    }

    // Check for duplicate attendance record if key fields are being updated
    if (student_id || subject || date) {
      const duplicateQuery = `
        SELECT id FROM attendance 
        WHERE student_id = ? AND subject = ? AND date = ? AND school_id = ? AND id != ?
      `;
      const [duplicateCheck] = await db.execute(duplicateQuery, [
        student_id || existingRecord[0].student_id,
        subject || existingRecord[0].subject,
        date || existingRecord[0].date,
        school_id,
        id
      ]);
      
      if (duplicateCheck.length > 0) {
        throw new Error("DUPLICATE_ATTENDANCE");
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (student_id) {
      updateFields.push("student_id = ?");
      updateValues.push(student_id);
    }
    
    if (subject) {
      updateFields.push("subject = ?");
      updateValues.push(subject);
    }
    
    if (date) {
      updateFields.push("date = ?");
      updateValues.push(date);
    }
    
    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }
    
    if (teacher_id) {
      updateFields.push("teacher_id = ?");
      updateValues.push(teacher_id);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    updateValues.push(id, school_id);

    const updateQuery = `
      UPDATE attendance 
      SET ${updateFields.join(", ")} 
      WHERE id = ? AND school_id = ?
    `;
    
    await db.execute(updateQuery, updateValues);

    // Return updated record
    return await getAttendanceById(id, school_id);

  } catch (error) {
    console.error("Error in updateAttendance:", error);
    throw error;
  }
}

// Delete attendance record
async function deleteAttendance(id, school_id) {
  try {
    // Check if attendance record exists and belongs to the school
    const checkQuery = `
      SELECT id FROM attendance WHERE id = ? AND school_id = ?
    `;
    const [existingRecord] = await db.execute(checkQuery, [id, school_id]);
    
    if (existingRecord.length === 0) {
      throw new Error("Attendance record not found");
    }

    const deleteQuery = `
      DELETE FROM attendance WHERE id = ? AND school_id = ?
    `;
    
    const [result] = await db.execute(deleteQuery, [id, school_id]);

    return {
      id,
      message: "Attendance record deleted successfully"
    };

  } catch (error) {
    console.error("Error in deleteAttendance:", error);
    throw error;
  }
}

// Get attendance statistics
async function getAttendanceStats(school_id, filters = {}) {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
      FROM attendance a
      LEFT JOIN student s ON a.student_id = s.id
      WHERE a.school_id = ?
    `;
    
    const queryParams = [school_id];
    
    // Add filters
    if (filters.student_id) {
      query += " AND a.student_id = ?";
      queryParams.push(filters.student_id);
    }
    
    if (filters.subject) {
      query += " AND a.subject LIKE ?";
      queryParams.push(`%${filters.subject}%`);
    }
    
    if (filters.class) {
      query += " AND s.class = ?";
      queryParams.push(filters.class);
    }
    
    if (filters.section) {
      query += " AND s.section = ?";
      queryParams.push(filters.section);
    }
    
    if (filters.start_date) {
      query += " AND a.date >= ?";
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += " AND a.date <= ?";
      queryParams.push(filters.end_date);
    }
    
    const [rows] = await db.execute(query, queryParams);
    return rows[0];

  } catch (error) {
    console.error("Error in getAttendanceStats:", error);
    throw error;
  }
}

// Bulk create attendance (for marking attendance for multiple students at once)
async function bulkCreateAttendance(attendanceRecords, school_id) {
  try {
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      throw new Error("Attendance records array is required and cannot be empty");
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < attendanceRecords.length; i++) {
      try {
        const record = await createAttendance(attendanceRecords[i], school_id);
        results.push(record);
      } catch (error) {
        errors.push({
          index: i,
          record: attendanceRecords[i],
          error: error.message
        });
      }
    }

    return {
      success_count: results.length,
      error_count: errors.length,
      successful_records: results,
      failed_records: errors
    };

  } catch (error) {
    console.error("Error in bulkCreateAttendance:", error);
    throw error;
  }
}

module.exports = {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  bulkCreateAttendance
};
