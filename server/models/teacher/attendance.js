const teacherAttendanceQueries = {
  // Helper function to parse class_id and extract class and section information
  parseClassId(classId) {
    // Handle different possible formats:
    // Format 1: "10A" -> class: "10", section: "A"
    // Format 2: "Class-10-A" -> class: "10", section: "A"  
    // Format 3: "10-A" -> class: "10", section: "A"
    // Format 4: Just "10" -> class: "10", section: null
    
    let className = null;
    let section = null;
    
    // Try pattern like "10A", "11B", etc.
    let match = classId.match(/^(\d+)([A-Z])$/);
    if (match) {
      className = match[1];
      section = match[2];
      return { className, section };
    }
    
    // Try pattern like "Class-10-A"
    match = classId.match(/^Class-(\d+)-([A-Z])$/i);
    if (match) {
      className = match[1];
      section = match[2];
      return { className, section };
    }
    
    // Try pattern like "10-A"
    match = classId.match(/^(\d+)-([A-Z])$/);
    if (match) {
      className = match[1];
      section = match[2];
      return { className, section };
    }
    
    // Try just numbers like "10"
    match = classId.match(/^(\d+)$/);
    if (match) {
      className = match[1];
      return { className, section: null };
    }
    
    // If no pattern matches, return the classId as is
    return { className: classId, section: null };
  },

  // Mark attendance for students in teacher's classes
  async markAttendance(db, teacherId, schoolId, attendanceData) {
    const { student_id, class_id, subject, date, status } = attendanceData;

    // Validate required fields
    if (!student_id || !class_id || !subject || !date || !status) {
      throw new Error('Missing required fields: student_id, class_id, subject, date, status');
    }

    // Validate status
    if (!['Present', 'Absent'].includes(status)) {
      throw new Error('Invalid status. Must be Present or Absent');
    }

    // Validate date format
    if (isNaN(Date.parse(date))) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
 
    // Verify teacher is assigned to this class
    const teacherQuery = `
      SELECT class_assigned, subject_specialty 
      FROM teacher 
      WHERE id = ? AND school_id = ?
    `;
    const [teacherData] = await db.execute(teacherQuery, [teacherId, schoolId]);
    
    if (teacherData.length === 0) {
      throw new Error('Teacher not found');
    }
    
    const teacher = teacherData[0];
    
    // Check if teacher is assigned to this class
    const assignedClasses = teacher.class_assigned ? 
      teacher.class_assigned.split(',').map(cls => cls.trim()) : [];
    
    // Parse class_id to extract class number (e.g., "12A" -> "12")
    const classMatch = class_id.match(/^(\d+)([A-Z]?)$/);
    const classToCheck = classMatch ? classMatch[0] : class_id; // Keep original if no match
    
    if (!assignedClasses.includes(classToCheck)) {
      throw new Error('You are not authorized to mark attendance for this class and subject');
    }

    // Verify student belongs to the class and school
    const studentQuery = `
      SELECT id, student_name, class, section 
      FROM student 
      WHERE id = ? AND school_id = ?
    `;
    const [studentCheck] = await db.execute(studentQuery, [student_id, schoolId]);
    
    if (studentCheck.length === 0) {
      throw new Error('Student not found in this school');
    }

    // Check if attendance already exists for this date
    const existingQuery = `
      SELECT id, status FROM attendance 
      WHERE student_id = ? AND subject = ? AND date = ? AND school_id = ?
    `;
    const [existing] = await db.execute(existingQuery, [student_id, subject, date, schoolId]);
    
    if (existing.length > 0) {
      // Attendance already exists - don't allow updates
      throw new Error(`Attendance for this student has already been marked for ${date}. You can only mark attendance once per day.`);
    } else {
      // Create new record
      const insertQuery = `
        INSERT INTO attendance (student_id, school_id, subject, date, status, teacher_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.execute(insertQuery, [
        student_id, schoolId, subject, date, status, teacherId
      ]);

      return {
        id: result.insertId,
        action: 'created',
        student_id,
        subject,
        date,
        status,
        teacher_id: teacherId
      };
    }
  },

  // Mark attendance for multiple students at once
  async markBulkAttendance(db, teacherId, schoolId, bulkData) {
    const { class_id, subject, date, attendance_records } = bulkData;

    // Validate bulk data
    if (!class_id || !subject || !date || !attendance_records || !Array.isArray(attendance_records)) {
      throw new Error('Invalid bulk attendance data');
    }

    // Verify teacher authorization using class_assigned field
    const teacherQuery = `
      SELECT class_assigned, subject_specialty 
      FROM teacher 
      WHERE id = ? AND school_id = ?
    `;
    const [teacherData] = await db.execute(teacherQuery, [teacherId, schoolId]);
    
    if (teacherData.length === 0) {
      throw new Error('Teacher not found');
    }
    
    const teacher = teacherData[0];
    
    // Check if teacher is assigned to this class
    const assignedClasses = teacher.class_assigned ? 
      teacher.class_assigned.split(',').map(cls => cls.trim()) : [];
    
    // Parse class_id to extract class number (e.g., "12A" -> "12")
    const classMatch = class_id.match(/^(\d+)([A-Z]?)$/);
    const classToCheck = classMatch ? classMatch[0] : class_id; // Keep original if no match
    
    if (!assignedClasses.includes(classToCheck)) {
      throw new Error('You are not authorized to mark attendance for this class and subject');
    }

    // Pre-check: Verify if attendance already exists for this class/subject/date
    // Check if any student from this class already has attendance marked for today
    const firstStudentId = attendance_records.length > 0 ? attendance_records[0].student_id : null;
    
    if (firstStudentId) {
      const existingAttendanceQuery = `
        SELECT COUNT(*) as count
        FROM attendance 
        WHERE student_id = ?
          AND subject = ? 
          AND date = ? 
          AND school_id = ?
      `;
      const [existingCheck] = await db.execute(existingAttendanceQuery, [firstStudentId, subject, date, schoolId]);

      if (existingCheck[0].count > 0) {
        throw new Error(
          `Attendance has already been marked for this class on ${date} for ${subject}. ` +
          `You can only mark attendance once per day for each class.`
        );
      }
    }

    const results = [];
    const errors = [];

    for (const record of attendance_records) {
      try {
        const result = await this.markAttendance(db, teacherId, schoolId, {
          student_id: record.student_id,
          class_id,
          subject,
          date,
          status: record.status
        });
        results.push(result);
      } catch (error) {
        errors.push({
          student_id: record.student_id,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      errors: errors,
      total_processed: attendance_records.length,
      successful_count: results.length,
      error_count: errors.length
    };
  },

  // Get attendance records for teacher's classes
  async getTeacherAttendance(db, teacherId, schoolId, filters = {}) {
    let query = `
      SELECT 
        a.id,
        a.student_id,
        a.subject,
        a.date,
        a.status,
        a.created_at,
        a.updated_at,
        s.student_name,
        s.class,
        s.section,
        s.student_id as roll_number
      FROM attendance a
      JOIN student s ON a.student_id = s.id
      WHERE a.school_id = ? AND a.teacher_id = ?
    `;
    
    const queryParams = [schoolId, teacherId];
    
    // Apply filters
    if (filters.class_id) {
      // Get class name from timetable and parse class_id for section
      const classInfoQuery = `SELECT class_name FROM timetable WHERE class_id = ? LIMIT 1`;
      const [classInfo] = await db.query(classInfoQuery, [filters.class_id]);
      
      if (classInfo.length > 0) {
        const classNameFromTimetable = classInfo[0].class_name;
        const parsedClassInfo = this.parseClassId(filters.class_id);
        
        if (parsedClassInfo.section) {
          query += ` AND s.class = ? AND s.section = ?`;
          queryParams.push(parsedClassInfo.className, parsedClassInfo.section);
        } else {
          query += ` AND s.class = ?`;
          queryParams.push(classNameFromTimetable);
        }
      }
    }
    
    if (filters.subject) {
      query += ` AND a.subject = ?`;
      queryParams.push(filters.subject);
    }
    
    if (filters.date) {
      query += ` AND a.date = ?`;
      queryParams.push(filters.date);
    }
    
    if (filters.status) {
      query += ` AND a.status = ?`;
      queryParams.push(filters.status);
    }
    
    if (filters.start_date) {
      query += ` AND a.date >= ?`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND a.date <= ?`;
      queryParams.push(filters.end_date);
    }

    if (filters.student_id) {
      query += ` AND a.student_id = ?`;
      queryParams.push(filters.student_id);
    }
    
    query += ` ORDER BY a.date DESC, s.student_name ASC`;
    
    const [rows] = await db.query(query, queryParams);
    return rows;
  },

  // Get students in teacher's class for attendance marking
  async getClassStudents(db, teacherId, schoolId, classId, subject) {
    // Verify teacher authorization for this class and subject
    const authQuery = `
      SELECT class_name, class_id FROM timetable 
      WHERE teacher_id = ? AND school_id = ? AND class_id = ? AND subject = ?
      LIMIT 1
    `;
    const [authCheck] = await db.query(authQuery, [teacherId, schoolId, classId, subject]);
    
    if (authCheck.length === 0) {
      throw new Error('You are not authorized to access students for this class and subject');
    }

    const classNameFromTimetable = authCheck[0].class_name;
    const authorizedClassId = authCheck[0].class_id;

  // Debug logs removed

    if (!classNameFromTimetable) {
      throw new Error('Class name not found for the given class ID');
    }

    // Parse class_id to extract class name and section
  const parsedClassInfo = this.parseClassId(classId);

    // Get students in the specific class and section
    let studentsQuery;
    let queryParams;

    if (parsedClassInfo.section) {
      // Filter by both class and section
      studentsQuery = `
        SELECT 
          id as student_id,
          student_name,
          student_id as roll_number,
          class,
          section
        FROM student 
        WHERE school_id = ? AND class = ? AND section = ?
        ORDER BY student_id ASC, student_name ASC
      `;
      queryParams = [schoolId, parsedClassInfo.className, parsedClassInfo.section];
    } else {
      // Use the class name from timetable if section cannot be determined
      studentsQuery = `
        SELECT 
          id as student_id,
          student_name,
          student_id as roll_number,
          class,
          section
        FROM student 
        WHERE school_id = ? AND class = ?
        ORDER BY student_id ASC, student_name ASC
      `;
      queryParams = [schoolId, classNameFromTimetable];
    }

    

    const [students] = await db.query(studentsQuery, queryParams);
    
    return students;
  },

  // Get attendance statistics for teacher's classes
  async getAttendanceStats(db, teacherId, schoolId, filters = {}) {
    let baseQuery = `
      FROM attendance a
      JOIN student s ON a.student_id = s.id
      WHERE a.school_id = ? AND a.teacher_id = ?
    `;
    
    const queryParams = [schoolId, teacherId];
    
    // Apply filters to base query
    if (filters.class_id) {
      // Get class name from timetable and parse class_id for section
      const classInfoQuery = `SELECT class_name FROM timetable WHERE class_id = ? LIMIT 1`;
      const [classInfo] = await db.query(classInfoQuery, [filters.class_id]);
      
      if (classInfo.length > 0) {
        const classNameFromTimetable = classInfo[0].class_name;
        const parsedClassInfo = this.parseClassId(filters.class_id);
        
        if (parsedClassInfo.section) {
          baseQuery += ` AND s.class = ? AND s.section = ?`;
          queryParams.push(parsedClassInfo.className, parsedClassInfo.section);
        } else {
          baseQuery += ` AND s.class = ?`;
          queryParams.push(classNameFromTimetable);
        }
      }
    }
    
    if (filters.subject) {
      baseQuery += ` AND a.subject = ?`;
      queryParams.push(filters.subject);
    }
    
    if (filters.start_date) {
      baseQuery += ` AND a.date >= ?`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      baseQuery += ` AND a.date <= ?`;
      queryParams.push(filters.end_date);
    }

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late_count,
        ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_percentage
      ${baseQuery}
    `;
    
    const [stats] = await db.query(statsQuery, queryParams);

    // Get class-wise statistics
    const classStatsQuery = `
      SELECT 
        s.class,
        COUNT(*) as total_records,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
        ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_percentage
      ${baseQuery}
      GROUP BY s.class
      ORDER BY s.class
    `;
    
    const [classStats] = await db.query(classStatsQuery, queryParams);

    // Get subject-wise statistics
    const subjectStatsQuery = `
      SELECT 
        a.subject,
        COUNT(*) as total_records,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
        ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_percentage
      ${baseQuery}
      GROUP BY a.subject
      ORDER BY a.subject
    `;
    
    const [subjectStats] = await db.query(subjectStatsQuery, queryParams);

    return {
      overall: stats[0],
      by_class: classStats,
      by_subject: subjectStats
    };
  },

  // Get today's attendance for quick dashboard view
  async getTodayAttendance(db, teacherId, schoolId) {
    const today = new Date().toISOString().split('T')[0];
    
    return await this.getTeacherAttendance(db, teacherId, schoolId, { date: today });
  },

  // Get class attendance statistics for teacher
  async getClassAttendanceStats(db, teacherId, schoolId, classSpec, subject, dateRange = {}) {
    try {
      // Verify teacher authorization
      const teacherQuery = `
        SELECT class_assigned, subject_specialty, name
        FROM teacher 
        WHERE id = ? AND school_id = ?
      `;
      const [teacherData] = await db.execute(teacherQuery, [teacherId, schoolId]);
      
      if (teacherData.length === 0) {
        throw new Error('Teacher not found');
      }
      
      const teacher = teacherData[0];
      
      // Check if teacher is assigned to this class
      const assignedClasses = teacher.class_assigned ? 
        teacher.class_assigned.split(',').map(cls => cls.trim()) : [];
      
      if (!assignedClasses.includes(classSpec)) {
        throw new Error('You are not authorized to view attendance for this class');
      }

      // Parse class specification (e.g., "12A" -> class="12", section="A")
      const classMatch = classSpec.match(/^(\d+)([A-Z]?)$/);
      if (!classMatch) {
        throw new Error('Invalid class format');
      }
      
      const classNumber = classMatch[1];
      const sectionLetter = classMatch[2];

      // Build date filter
      let dateFilter = '';
      let dateParams = [];
      if (dateRange.start_date) {
        dateFilter += ' AND a.date >= ?';
        dateParams.push(dateRange.start_date);
      }
      if (dateRange.end_date) {
        dateFilter += ' AND a.date <= ?';
        dateParams.push(dateRange.end_date);
      }

      // Get students with their attendance statistics
      let studentQuery = `
        SELECT 
          s.id,
          s.student_id,
          s.student_name,
          s.class,
          s.section,
          COUNT(a.id) as total_records,
          SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
          ROUND(
            (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(a.id), 0)), 2
          ) as attendance_percentage
        FROM student s
        LEFT JOIN attendance a ON s.id = a.student_id 
          AND a.school_id = ? 
          AND a.subject = ?
          ${dateFilter}
        WHERE s.school_id = ? AND s.class = ?
      `;
      
      let queryParams = [schoolId, subject, ...dateParams, schoolId, classNumber];
      
      if (sectionLetter) {
        studentQuery += ' AND s.section = ?';
        queryParams.push(sectionLetter);
      }
      
      studentQuery += ` 
        AND (s.status = 'active' OR s.status IS NULL)
        GROUP BY s.id, s.student_id, s.student_name, s.class, s.section
        ORDER BY s.student_name
      `;

      const [students] = await db.execute(studentQuery, queryParams);

      // Get overall class statistics
      let classStatsQuery = `
        SELECT 
          COUNT(DISTINCT s.id) as total_students,
          COUNT(a.id) as total_attendance_records,
          SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as total_present,
          SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as total_absent,
          ROUND(
            (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(a.id), 0)), 2
          ) as class_average_attendance
        FROM student s
        LEFT JOIN attendance a ON s.id = a.student_id 
          AND a.school_id = ? 
          AND a.subject = ?
          ${dateFilter}
        WHERE s.school_id = ? AND s.class = ?
      `;
      
      let statsParams = [schoolId, subject, ...dateParams, schoolId, classNumber];
      
      if (sectionLetter) {
        classStatsQuery += ' AND s.section = ?';
        statsParams.push(sectionLetter);
      }

      const [classStats] = await db.execute(classStatsQuery, statsParams);

      return {
        students: students.map(student => ({
          ...student,
          attendance_percentage: student.attendance_percentage || 0
        })),
        class_statistics: classStats[0] || {
          total_students: 0,
          total_attendance_records: 0,
          total_present: 0,
          total_absent: 0,
          class_average_attendance: 0
        },
        class_info: {
          class: classNumber,
          section: sectionLetter || 'All',
          subject: subject,
          teacher_name: teacher.name
        }
      };
      
    } catch (error) {
      console.error("Error in getClassAttendanceStats:", error);
      throw error;
    }
  }
};

module.exports = teacherAttendanceQueries;
