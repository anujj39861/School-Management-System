const db = require('../../database/db');

const Timetable = {
  async getAllClasses(schoolId) {
    const [rows] = await db.execute(
      'SELECT DISTINCT class_id, class_name, school_days FROM timetable WHERE school_id = ?',
      [schoolId]
    );
    return rows;
  },

  async getTimetableByClass(schoolId, classId) {
    const [classRows] = await db.execute(
      'SELECT school_days FROM timetable WHERE school_id = ? AND class_id = ? LIMIT 1',
      [schoolId, classId]
    );
    if (classRows.length === 0) {
      throw new Error('Class not found');
    }
    const days = classRows[0].school_days.split(',');

    const [timetableRows] = await db.execute(
      'SELECT day, time_slot, subject, teacher, room FROM timetable WHERE school_id = ? AND class_id = ?',
      [schoolId, classId]
    );

    const timetable = {};
    days.forEach(day => {
      timetable[day] = timetableRows
        .filter(row => row.day === day)
        .map(row => ({
          time: row.time_slot,
          subject: row.subject || '',
          teacher: row.teacher || '',
          room: row.room || ''
        }));
    });

    return { classId, timetable };
  },

  async createClass(schoolId, classId, className, schoolDays, timetable) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute(
        'SELECT class_id FROM timetable WHERE school_id = ? AND class_id = ? LIMIT 1',
        [schoolId, classId]
      );
      if (existing.length > 0) {
        throw new Error('Class ID already exists for this school');
      }
      for (const day of Object.keys(timetable)) {
        if (!schoolDays.includes(day)) {
          throw new Error(`Invalid day: ${day} not in school_days`);
        }
        for (const slot of timetable[day]) {
          if (slot.subject || slot.teacher || slot.room) {
            await connection.execute(
              'INSERT INTO timetable (school_id, class_id, class_name, school_days, day, time_slot, subject, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [schoolId, classId, className, schoolDays.join(','), day, slot.time, slot.subject || null, slot.teacher || null, slot.room || null]
            );
          }
        }
      }
      await connection.commit();
      return { classId, className, schoolDays };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async createOrUpdateSlot(schoolId, classId, className, schoolDays, day, timeSlot, subject, teacher, room) {
    const [existing] = await db.execute(
      'SELECT id, school_days FROM timetable WHERE school_id = ? AND class_id = ? AND day = ? AND time_slot = ?',
      [schoolId, classId, day, timeSlot]
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE timetable SET subject = ?, teacher = ?, room = ? WHERE school_id = ? AND class_id = ? AND day = ? AND time_slot = ?',
        [subject || null, teacher || null, room || null, schoolId, classId, day, timeSlot]
      );
    } else {
      await db.execute(
        'INSERT INTO timetable (school_id, class_id, class_name, school_days, day, time_slot, subject, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [schoolId, classId, className, schoolDays.join(','), day, timeSlot, subject || null, teacher || null, room || null]
      );
    }
  },

  async updateTimetable(schoolId, classId, schoolDays, timetable) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        'DELETE FROM timetable WHERE school_id = ? AND class_id = ?',
        [schoolId, classId]
      );
      const [existing] = await connection.execute(
        'SELECT class_name FROM timetable WHERE school_id = ? AND class_id = ? LIMIT 1',
        [schoolId, classId]
      );
      const className = existing.length > 0 ? existing[0].class_name : 'Unknown Class';
      for (const day of Object.keys(timetable)) {
        if (!schoolDays.includes(day)) {
          throw new Error(`Invalid day: ${day} not in school_days`);
        }
        for (const slot of timetable[day]) {
          if (slot.subject || slot.teacher || slot.room) {
            await connection.execute(
              'INSERT INTO timetable (school_id, class_id, class_name, school_days, day, time_slot, subject, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [schoolId, classId, className, schoolDays.join(','), day, slot.time, slot.subject || null, slot.teacher || null, slot.room || null]
            );
          }
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async deleteSlot(schoolId, classId, day, timeSlot) {
    await db.execute(
      'DELETE FROM timetable WHERE school_id = ? AND class_id = ? AND day = ? AND time_slot = ?',
      [schoolId, classId, day, timeSlot]
    );
  },

  async deleteClass(schoolId, classId) {
    await db.execute(
      'DELETE FROM timetable WHERE school_id = ? AND class_id = ?',
      [schoolId, classId]
    );
  }
};

module.exports = Timetable;