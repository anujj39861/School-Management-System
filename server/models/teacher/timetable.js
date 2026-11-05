const teacherTimetableQueries = {
  // Get teacher's timetable by teacher database ID
  async getTeacherTimetable(db, teacherId, schoolId) {
    const query = `
      SELECT id, school_id, class_id, class_name, school_days, day, time_slot, 
             subject, teacher, room, teacher_id
      FROM timetable
      WHERE teacher_id = ? AND school_id = ?
      ORDER BY 
        CASE day
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        time_slot
    `;
    const [rows] = await db.query(query, [teacherId, schoolId]);
    return rows;
  },

  // Get teacher's timetable for a specific day
  async getTeacherTimetableByDay(db, teacherId, schoolId, day) {
    const query = `
      SELECT id, school_id, class_id, class_name, school_days, day, time_slot, 
             subject, teacher, room, teacher_id
      FROM timetable
      WHERE teacher_id = ? AND school_id = ? AND day = ?
      ORDER BY time_slot
    `;
    const [rows] = await db.query(query, [teacherId, schoolId, day]);
    return rows;
  },

  // Get teacher's current/next class (for dashboard)
  async getCurrentClass(db, teacherId, schoolId) {
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const query = `
      SELECT id, school_id, class_id, class_name, day, time_slot, 
             subject, teacher, room, teacher_id
      FROM timetable
      WHERE teacher_id = ? AND school_id = ? AND day = ?
      ORDER BY time_slot
    `;
    const [rows] = await db.query(query, [teacherId, schoolId, currentDay]);
    
    // Find current or next class
    const now = new Date(`1970-01-01T${currentTime}:00`);
    let currentClass = null;
    let nextClass = null;

    for (const row of rows) {
      // Parse time slot (assuming format like "09:00-10:00")
      const timeSlotParts = row.time_slot.split('-');
      if (timeSlotParts.length === 2) {
        const startTime = new Date(`1970-01-01T${timeSlotParts[0]}:00`);
        const endTime = new Date(`1970-01-01T${timeSlotParts[1]}:00`);
        
        if (now >= startTime && now <= endTime) {
          currentClass = row;
          break;
        } else if (now < startTime && !nextClass) {
          nextClass = row;
        }
      }
    }

    return {
      current: currentClass,
      next: nextClass,
      today: rows
    };
  },

  // Get teacher's weekly schedule summary
  async getWeeklySchedule(db, teacherId, schoolId) {
    const query = `
      SELECT day, COUNT(*) as class_count,
             GROUP_CONCAT(DISTINCT subject ORDER BY time_slot) as subjects,
             GROUP_CONCAT(DISTINCT class_name ORDER BY time_slot) as classes
      FROM timetable
      WHERE teacher_id = ? AND school_id = ?
      GROUP BY day
      ORDER BY 
        CASE day
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END
    `;
    const [rows] = await db.query(query, [teacherId, schoolId]);
    return rows;
  },

  // Get all classes taught by teacher (unique classes)
  async getTeacherClasses(db, teacherId, schoolId) {
    const query = `
      SELECT DISTINCT class_id, class_name, subject,
             GROUP_CONCAT(DISTINCT room ORDER BY room SEPARATOR ', ') as rooms
      FROM timetable
      WHERE teacher_id = ? AND school_id = ?
      GROUP BY class_id, class_name, subject
      ORDER BY class_name
    `;
    const [rows] = await db.query(query, [teacherId, schoolId]);
    return rows;
  },

  // Get teacher's subjects
  async getTeacherSubjects(db, teacherId, schoolId) {
    const query = `
      SELECT DISTINCT subject
      FROM timetable
      WHERE teacher_id = ? AND school_id = ? AND subject IS NOT NULL
      ORDER BY subject
    `;
    const [rows] = await db.query(query, [teacherId, schoolId]);
    return rows.map(row => row.subject);
  },

  // Get teacher's total teaching hours per week
  async getTeachingHours(db, teacherId, schoolId) {
    const query = `
      SELECT COUNT(*) as total_periods,
             COUNT(DISTINCT day) as teaching_days,
             COUNT(DISTINCT class_id) as total_classes,
             COUNT(DISTINCT subject) as total_subjects
      FROM timetable
      WHERE teacher_id = ? AND school_id = ?
    `;
    const [rows] = await db.query(query, [teacherId, schoolId]);
    return rows[0];
  },

  // Get free periods for teacher on a specific day
  async getFreePeriods(db, teacherId, schoolId, day) {
    // Get all time slots for the school on that day
    const allSlotsQuery = `
      SELECT DISTINCT time_slot
      FROM timetable
      WHERE school_id = ? AND day = ?
      ORDER BY time_slot
    `;
    const [allSlots] = await db.query(allSlotsQuery, [schoolId, day]);

    // Get teacher's occupied slots for that day
    const occupiedSlotsQuery = `
      SELECT time_slot
      FROM timetable
      WHERE teacher_id = ? AND school_id = ? AND day = ?
    `;
    const [occupiedSlots] = await db.query(occupiedSlotsQuery, [teacherId, schoolId, day]);

    const occupiedTimeSlots = occupiedSlots.map(slot => slot.time_slot);
    const freeSlots = allSlots.filter(slot => !occupiedTimeSlots.includes(slot.time_slot));

    return freeSlots;
  },

  // Get teacher's schedule conflicts (if any)
  async getScheduleConflicts(db, teacherId, schoolId) {
    const query = `
      SELECT day, time_slot, COUNT(*) as conflict_count,
             GROUP_CONCAT(CONCAT(class_name, '(', subject, ')') SEPARATOR ', ') as conflicting_classes
      FROM timetable
      WHERE teacher_id = ? AND school_id = ?
      GROUP BY day, time_slot
      HAVING COUNT(*) > 1
      ORDER BY day, time_slot
    `;
    const [rows] = await db.query(query, [teacherId, schoolId]);
    return rows;
  }
};

module.exports = teacherTimetableQueries;
