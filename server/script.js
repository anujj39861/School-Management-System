const db = require("./database/db");
const bcrypt = require("bcrypt");

const saltRounds = 10;

async function updateStudentUsernames() {
  try {
    // 1. Get all students without a username
    const [students] = await db.execute(
      `SELECT id, student_name, dob, contact_no 
       FROM student
       WHERE hashed_password IS NULL OR hashed_password = ''`
    );

    for (let student of students) {
      // First name in lowercase
      const firstName = student.student_name.split(" ")[0].toLowerCase();

      // Format DOB as YYMMDD
      const dobDate = new Date(student.dob);
      const yy = dobDate.getFullYear().toString().slice(-2);
      const mm = String(dobDate.getMonth() + 1).padStart(2, "0");
      const dd = String(dobDate.getDate()).padStart(2, "0");
      const dobYYMMDD = yy + mm + dd;

      // Last 4 digits of phone
      const phoneLast4 = student.contact_no
        ? student.contact_no.slice(-4)
        : Math.floor(1000 + Math.random() * 9000); // fallback

      // Create username
      const username = `${firstName}${dobYYMMDD}${phoneLast4}`;

      // Default password in DDMMYYYY
      const dobDDMMYYYY = dd + mm + dobDate.getFullYear();
      const hashedPassword = await bcrypt.hash(dobDDMMYYYY, saltRounds);

      // 2. Update in DB
      await db.execute(
        `UPDATE student SET username = ?, hashed_password = ? WHERE id = ?`,
        [username, hashedPassword, student.id]
      );

  console.info(`✅ ${student.student_name} → ${username}`);
    }

  console.info("🎯 All student usernames & passwords updated.");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

updateStudentUsernames();
