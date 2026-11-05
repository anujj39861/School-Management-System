const db = require("../../database/db");

// Get students assigned to a teacher's classes based on class_assigned field
async function getTeacherStudents(teacher_id, school_id, filters = {}) {
  try {
    // First, get the teacher's assigned classes from their profile
    const teacherQuery = `
      SELECT class_assigned, subject_specialty, name
      FROM teacher 
      WHERE id = ? AND school_id = ?
    `;
    
    const [teacherData] = await db.execute(teacherQuery, [teacher_id, school_id]);
    
    if (teacherData.length === 0) {
      throw new Error("Teacher not found");
    }
    
    const teacher = teacherData[0];
    
    // Parse class_assigned (e.g., "8, 7, 6" or "8A, 7B, 6C")
    let assignedClasses = [];
    let classConditions = [];
    let classParams = [];
    
    if (teacher.class_assigned) {
      assignedClasses = teacher.class_assigned.split(',').map(cls => cls.trim());
      
      // Build conditions for each assigned class
      assignedClasses.forEach(classSpec => {
        const classMatch = classSpec.match(/^(\d+)([A-Z]?)$/);
        if (classMatch) {
          const classNumber = classMatch[1];
          const sectionLetter = classMatch[2];
          
          if (sectionLetter) {
            // Specific section like "12A"
            classConditions.push("(s.class = ? AND s.section = ?)");
            classParams.push(classNumber, sectionLetter);
          } else {
            // All sections of a class like "8"
            classConditions.push("s.class = ?");
            classParams.push(classNumber);
          }
        }
      });
    }
    
    if (classConditions.length === 0) {
      return {
        students: [],
        availableClasses: [],
        availableSubjects: teacher.subject_specialty ? [teacher.subject_specialty] : []
      };
    }
    
    // Build student query
    let studentQuery = `
      SELECT 
        s.id,
        s.student_id,
        s.student_name,
        s.class,
        s.section,
        s.father_name,
        s.mother_name,
        s.contact_no,
        s.email,
        s.status
      FROM student s
      WHERE s.school_id = ? AND (${classConditions.join(' OR ')})
    `;
    
    let queryParams = [school_id, ...classParams];
    
    // Add filters
    if (filters.class) {
      // Parse filter class like "12A" into class="12" and section="A"
      const filterMatch = filters.class.match(/^(\d+)([A-Z]?)$/);
      if (filterMatch) {
        const filterClassNumber = filterMatch[1];
        const filterSectionLetter = filterMatch[2];
        
        studentQuery += " AND s.class = ?";
        queryParams.push(filterClassNumber);
        
        if (filterSectionLetter) {
          studentQuery += " AND s.section = ?";
          queryParams.push(filterSectionLetter);
        }
      }
    }
    
    if (filters.section && !filters.class) {
      studentQuery += " AND s.section = ?";
      queryParams.push(filters.section);
    }
    
    studentQuery += " AND (s.status = 'active' OR s.status IS NULL) ORDER BY s.class, s.section, s.student_name";
    
    const [students] = await db.execute(studentQuery, queryParams);
    
    // Get unique sections from the students
    const availableSections = [...new Set(students.map(s => s.section))].filter(Boolean);
    
    return {
      students,
      availableClasses: assignedClasses,
      availableSubjects: teacher.subject_specialty ? [teacher.subject_specialty] : [],
      availableSections: availableSections,
      teacherName: teacher.name
    };
    
  } catch (error) {
    console.error("Error in getTeacherStudents:", error);
    throw new Error(`Database error: ${error.message}`);
  }
}

// Get students for a specific class taught by teacher
async function getStudentsByClassAndSubject(teacher_id, school_id, class_name, subject) {
  try {
    // Verify teacher is assigned to this class
    const teacherQuery = `
      SELECT class_assigned, subject_specialty, name
      FROM teacher 
      WHERE id = ? AND school_id = ?
    `;
    
    const [teacherData] = await db.execute(teacherQuery, [teacher_id, school_id]);
    
    if (teacherData.length === 0) {
      throw new Error("Teacher not found");
    }
    
    const teacher = teacherData[0];
    
    // Check if teacher is assigned to this class
    const assignedClasses = teacher.class_assigned ? 
      teacher.class_assigned.split(',').map(cls => cls.trim()) : [];
    
    if (!assignedClasses.includes(class_name)) {
      throw new Error("You are not authorized to access students for this class");
    }
    
    // Optional: Check if teacher teaches this subject
    if (subject && teacher.subject_specialty && teacher.subject_specialty !== subject) {
      console.warn(`Teacher specialty is ${teacher.subject_specialty}, but requesting ${subject}`);
    }
    
    // Parse class_name to separate class and section (e.g., "12A" -> class="12", section="A")
    let classNumber = class_name;
    let sectionLetter = '';
    
    // Check if class_name contains a letter at the end (like "12A")
    const classMatch = class_name.match(/^(\d+)([A-Z]?)$/);
    if (classMatch) {
      classNumber = classMatch[1];  // "12"
      sectionLetter = classMatch[2]; // "A"
    }
    
    // Get students from the class
    let studentQuery = `
      SELECT 
        s.id,
        s.student_id,
        s.student_name,
        s.class,
        s.section,
        s.father_name,
        s.mother_name,
        s.contact_no,
        s.email,
        s.status
      FROM student s
      WHERE s.school_id = ? AND s.class = ?
    `;
    
    let queryParams = [school_id, classNumber];
    
    // If section is specified, filter by section
    if (sectionLetter) {
      studentQuery += " AND s.section = ?";
      queryParams.push(sectionLetter);
    }
    
    studentQuery += " AND (s.status = 'active' OR s.status IS NULL) ORDER BY s.section, s.student_name";
    
    const [students] = await db.execute(studentQuery, queryParams);
    
    return students;
    
  } catch (error) {
    console.error("Error in getStudentsByClassAndSubject:", error);
    throw error;
  }
}

// Get teacher's assigned classes and subjects (simplified)
async function getTeacherAssignments(teacher_id, school_id) {
  try {
    const query = `
      SELECT 
        class_assigned,
        subject_specialty,
        name
      FROM teacher 
      WHERE id = ? AND school_id = ?
    `;
    
    const [teacherData] = await db.execute(query, [teacher_id, school_id]);
    
    if (teacherData.length === 0) {
      throw new Error("Teacher not found");
    }
    
    const teacher = teacherData[0];
    
    // Parse assigned classes
    const assignedClasses = teacher.class_assigned ? 
      teacher.class_assigned.split(',').map(cls => cls.trim()) : [];
    
    // Create assignments array
    const assignments = assignedClasses.map(className => ({
      class_name: className,
      subject: teacher.subject_specialty || 'Not specified',
      teacher_name: teacher.name
    }));
    
    return assignments;
    
  } catch (error) {
    console.error("Error in getTeacherAssignments:", error);
    throw new Error(`Database error: ${error.message}`);
  }
}

// Get teacher profile information
async function getTeacherProfile(teacher_id, school_id) {
  try {
    const query = `
      SELECT 
        id,
        teacher_id,
        name,
        email,
        username,
        subject_specialty,
        class_assigned,
        contact_no,
        address,
        status,
        created_at
      FROM teacher 
      WHERE id = ? AND school_id = ?
    `;
    
    const [teachers] = await db.execute(query, [teacher_id, school_id]);
    
    if (teachers.length === 0) {
      throw new Error("Teacher not found");
    }
    
    return teachers[0];
    
  } catch (error) {
    console.error("Error in getTeacherProfile:", error);
    throw error;
  }
}

module.exports = {
  getTeacherStudents,
  getStudentsByClassAndSubject,
  getTeacherAssignments,
  getTeacherProfile
};
