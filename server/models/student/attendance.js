const db = require('../../database/db');

class StudentAttendance {
  // Get student's own attendance records
  static async getStudentAttendance(student_id, filters = {}) {
    try {
      let query = `
        SELECT 
          a.id,
          a.student_id,
          a.subject,
          a.date,
          a.status,
          a.teacher_id,
          s.student_name,
          s.class,
          s.section,
          t.name as teacher_name
        FROM attendance a
        LEFT JOIN student s ON a.student_id = s.id
        LEFT JOIN teacher t ON a.teacher_id = t.id
        WHERE a.student_id = ? AND a.school_id = ?
      `;
      
      // Convert to integers
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(filters.school_id);
      const queryParams = [studentIdInt, schoolIdInt];
      
      // Add additional filters
      if (filters.subject) {
        query += ' AND a.subject LIKE ?';
        queryParams.push(`%${filters.subject}%`);
      }
      
      if (filters.start_date) {
        query += ' AND a.date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND a.date <= ?';
        queryParams.push(filters.end_date);
      }
      
      if (filters.status) {
        query += ' AND a.status = ?';
        queryParams.push(filters.status);
      }
      
      query += ' ORDER BY a.date DESC, a.subject ASC';
      
      if (filters.limit) {
        const limitInt = parseInt(filters.limit);
        query += ` LIMIT ${limitInt}`;
      }
      
      const [rows] = await db.execute(query, queryParams);
      return rows;
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  }

  // Get student's attendance statistics
  static async getStudentAttendanceStats(student_id, school_id, filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
          ROUND(
            (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as attendance_percentage
        FROM attendance 
        WHERE student_id = ? AND school_id = ?
      `;
      
      // Convert to integers
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(school_id);
      const queryParams = [studentIdInt, schoolIdInt];
      
      if (filters.subject) {
        query += ' AND subject LIKE ?';
        queryParams.push(`%${filters.subject}%`);
      }
      
      if (filters.start_date) {
        query += ' AND date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND date <= ?';
        queryParams.push(filters.end_date);
      }
      
      const [rows] = await db.execute(query, queryParams);
      return rows[0] || {
        total_records: 0,
        present_count: 0,
        absent_count: 0,
        attendance_percentage: 0
      };
    } catch (error) {
      console.error('Error fetching student attendance stats:', error);
      throw error;
    }
  }

  // Get subject-wise attendance for student
  static async getSubjectWiseAttendance(student_id, school_id, filters = {}) {
    try {
      let query = `
        SELECT 
          subject,
          COUNT(*) as total_classes,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
          ROUND(
            (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as attendance_percentage
        FROM attendance 
        WHERE student_id = ? AND school_id = ?
      `;
      
      // Convert to integers
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(school_id);
      const queryParams = [studentIdInt, schoolIdInt];
      
      if (filters.start_date) {
        query += ' AND date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND date <= ?';
        queryParams.push(filters.end_date);
      }
      
      query += ' GROUP BY subject ORDER BY subject ASC';
      
      const [rows] = await db.execute(query, queryParams);
      return rows;
    } catch (error) {
      console.error('Error fetching subject-wise attendance:', error);
      throw error;
    }
  }

  // Get monthly attendance summary for student
  static async getMonthlyAttendance(student_id, school_id, year, month) {
    try {
      const query = `
        SELECT 
          DATE(date) as attendance_date,
          subject,
          status,
          teacher_id,
          t.name as teacher_name
        FROM attendance a
        LEFT JOIN teacher t ON a.teacher_id = t.id
        WHERE a.student_id = ? 
          AND a.school_id = ? 
          AND YEAR(date) = ? 
          AND MONTH(date) = ?
        ORDER BY date ASC, subject ASC
      `;
      
      // Convert to integers
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(school_id);
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      
      const [rows] = await db.execute(query, [studentIdInt, schoolIdInt, yearInt, monthInt]);
      
      // Group by date
      const dateGroups = {};
      rows.forEach(record => {
        const date = record.attendance_date;
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(record);
      });
      
      return dateGroups;
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      throw error;
    }
  }

  // Get recent attendance (last N records)
  static async getRecentAttendance(student_id, school_id, limit = 10) {
    try {
  // debug log removed
      
      // Ensure all parameters are the correct data types
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(school_id);
      const limitInt = parseInt(limit) || 10;
      
      // Use string concatenation for LIMIT as it can't be parameterized reliably in mysql2
      const query = `
        SELECT 
          a.id,
          a.subject,
          a.date,
          a.status,
          t.name as teacher_name
        FROM attendance a
        LEFT JOIN teacher t ON a.teacher_id = t.id
        WHERE a.student_id = ? AND a.school_id = ?
        ORDER BY a.date DESC, a.subject ASC
        LIMIT ${limitInt}
      `;
      
      const params = [studentIdInt, schoolIdInt];
  // debug log removed
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
      throw error;
    }
  }

  // Get attendance by date range
  static async getAttendanceByDateRange(student_id, school_id, start_date, end_date) {
    try {
      const query = `
        SELECT 
          DATE(date) as attendance_date,
          COUNT(*) as total_classes,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
          ROUND(
            (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as daily_attendance_percentage
        FROM attendance 
        WHERE student_id = ? 
          AND school_id = ? 
          AND date BETWEEN ? AND ?
        GROUP BY DATE(date)
        ORDER BY date DESC
      `;
      
      // Convert to integers
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(school_id);
      
      const [rows] = await db.execute(query, [studentIdInt, schoolIdInt, start_date, end_date]);
      return rows;
    } catch (error) {
      console.error('Error fetching attendance by date range:', error);
      throw error;
    }
  }

  // Get attendance percentage for a specific subject
  static async getSubjectAttendancePercentage(student_id, school_id, subject) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
          ROUND(
            (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as attendance_percentage
        FROM attendance 
        WHERE student_id = ? 
          AND school_id = ? 
          AND subject = ?
      `;
      
      // Convert to integers
      const studentIdInt = parseInt(student_id);
      const schoolIdInt = parseInt(school_id);
      
      const [rows] = await db.execute(query, [studentIdInt, schoolIdInt, subject]);
      return rows[0] || {
        total_classes: 0,
        present_count: 0,
        attendance_percentage: 0
      };
    } catch (error) {
      console.error('Error fetching subject attendance percentage:', error);
      throw error;
    }
  }
}

module.exports = StudentAttendance;
