const db = require('../../database/db');

const StudentTimetable = {
  // Get student's class information
  async getStudentClass(studentId) {
    const [rows] = await db.execute(
      'SELECT class, section, school_id FROM student WHERE id = ?',
      [studentId]
    );
    if (rows.length === 0) {
      throw new Error('Student not found');
    }
    return rows[0];
  },

  // Get timetable for student's class
  async getStudentTimetable(studentId) {
    try {
      // First get the student's class information
      const studentInfo = await this.getStudentClass(studentId);
      const { class: studentClass, section, school_id: schoolId } = studentInfo;
      
      
      
      // Validate school_id
      if (!schoolId) {
        throw new Error('Student school information is incomplete');
      }
      
      // Try different formats for class_id in order of preference
      const possibleClassIds = [
        `${studentClass}${section || ''}`,     // 12A (most specific)
        `${studentClass}-${section || ''}`,    // 12-A
        `${studentClass} ${section || ''}`,    // 12 A
        studentClass,                          // 12 (fallback to class only)
        `Class ${studentClass}${section || ''}`, // Class 12A
        `Class ${studentClass}`,               // Class 12
      ];

      
      

      let classRows = [];
      let matchedClassId = null;

      // Try each possible class_id format
      for (const classId of possibleClassIds) {
        
        const [rows] = await db.execute(
          'SELECT school_days, class_id FROM timetable WHERE school_id = ? AND class_id = ? LIMIT 1',
          [schoolId, classId]
        );
        
        if (rows.length > 0) {
          classRows = rows;
          matchedClassId = classId;
          
          break;
        }
      }
      
      if (classRows.length === 0) {
        // Always show class-specific error regardless of whether school has timetables or not
        const [allTimetables] = await db.execute(
          'SELECT DISTINCT class_id, class_name FROM timetable WHERE school_id = ?',
          [schoolId]
        );
        
        if (allTimetables.length === 0) {
          // Even if no timetables exist for school, show class-specific error
          
          throw new Error(`No timetable available for your class (${studentClass}${section || ''}). No classes have been set up in your school yet.`);
        }
        
        const availableClasses = allTimetables.map(t => t.class_id).join(', ');
        
        throw new Error(`No timetable available for your class (${studentClass}${section || ''}). Available classes in your school: ${availableClasses}`);
      }
      
      const days = classRows[0].school_days.split(',');
      const className = `Class ${studentClass} ${section}`;

      // Get the complete timetable for the class
      const [timetableRows] = await db.execute(
        'SELECT day, time_slot, subject, teacher, room FROM timetable WHERE school_id = ? AND class_id = ? ORDER BY day, time_slot',
        [schoolId, matchedClassId]
      );

      // Organize timetable by days
      const timetable = {};
      days.forEach(day => {
        timetable[day] = timetableRows
          .filter(row => row.day === day)
          .map(row => ({
            time: row.time_slot,
            subject: row.subject || 'Free Period',
            teacher: row.teacher || 'N/A',
            room: row.room || 'N/A'
          }));
      });

      return {
        classId: matchedClassId,
        className,
        schoolDays: days,
        timetable
      };
    } catch (error) {
      throw error;
    }
  },

  // Get today's schedule for student
  async getTodaySchedule(studentId) {
    try {
      const studentInfo = await this.getStudentClass(studentId);
      const { class: studentClass, section, school_id: schoolId } = studentInfo;
      
      
      
      // Validate school_id
      if (!schoolId) {
        throw new Error('Student school information is incomplete');
      }
      
      // Use the same flexible matching logic as getStudentTimetable
      const possibleClassIds = [
        `${studentClass}${section || ''}`,     // 12A
        `${studentClass}-${section || ''}`,    // 12-A
        `${studentClass} ${section || ''}`,    // 12 A
        studentClass,                          // 12
        `Class ${studentClass}${section || ''}`, // Class 12A
        `Class ${studentClass}`,               // Class 12
      ];

      let matchedClassId = null;
      for (const classId of possibleClassIds) {
        const [rows] = await db.execute(
          'SELECT class_id FROM timetable WHERE school_id = ? AND class_id = ? LIMIT 1',
          [schoolId, classId]
        );
        
        if (rows.length > 0) {
          matchedClassId = classId;
          
          break;
        }
      }

      if (!matchedClassId) {
        // Always show class-specific error regardless of whether school has timetables or not
        const [allTimetables] = await db.execute(
          'SELECT DISTINCT class_id FROM timetable WHERE school_id = ?',
          [schoolId]
        );
        
        if (allTimetables.length === 0) {
          // Even if no timetables exist for school, show class-specific error
          throw new Error(`No timetable available for your class (${studentClass}${section || ''}). No classes have been set up in your school yet.`);
        }
        
        const availableClasses = allTimetables.map(t => t.class_id).join(', ');
        throw new Error(`No timetable available for your class (${studentClass}${section || ''}). Available classes: ${availableClasses}`);
      }

      // Get current day of week
      const today = new Date();
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = daysOfWeek[today.getDay()];

      

      // Get today's timetable
      const [todayTimetableRows] = await db.execute(
        'SELECT time_slot, subject, teacher, room FROM timetable WHERE school_id = ? AND class_id = ? AND day = ? ORDER BY time_slot',
        [schoolId, matchedClassId, currentDay]
      );

      const todaySchedule = todayTimetableRows.map(row => ({
        time: row.time_slot,
        subject: row.subject || 'Free Period',
        teacher: row.teacher || 'N/A',
        room: row.room || 'N/A'
      }));

      return {
        day: currentDay,
        schedule: todaySchedule
      };
    } catch (error) {
      throw error;
    }
  },

  // Get next class for student
  async getNextClass(studentId) {
    try {
      const todaySchedule = await this.getTodaySchedule(studentId);
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // Get HH:MM format

      // Find the next class
      const nextClass = todaySchedule.schedule.find(slot => {
        return slot.time > currentTime && slot.subject !== 'Free Period';
      });

      return {
        hasNextClass: !!nextClass,
        nextClass: nextClass || null,
        currentDay: todaySchedule.day
      };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = StudentTimetable;
