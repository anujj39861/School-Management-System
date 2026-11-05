const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL');

  await conn.query('CREATE DATABASE IF NOT EXISTS schoolmaster');
  await conn.query('USE schoolmaster');
  console.log('✅ Database "schoolmaster" ready');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS school_user (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      address TEXT,
      logo_url VARCHAR(500),
      subscription_plan VARCHAR(100),
      hashed_password VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS teacher (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      username VARCHAR(255) UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      gender VARCHAR(10),
      dob DATE,
      address TEXT,
      qualification VARCHAR(255),
      experience_years INT DEFAULT 0,
      subject_specialty VARCHAR(255),
      class_assigned VARCHAR(255),
      school_id INT NOT NULL,
      profile_pic_url VARCHAR(500),
      joining_date DATE,
      salary DECIMAL(10,2),
      role VARCHAR(50) DEFAULT 'teacher',
      is_active TINYINT(1) DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES school_user(id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS student (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(50),
      student_name VARCHAR(255) NOT NULL,
      class VARCHAR(50) NOT NULL,
      section VARCHAR(10),
      father_name VARCHAR(255) NOT NULL,
      mother_name VARCHAR(255) NOT NULL,
      dob DATE NOT NULL,
      gender VARCHAR(10),
      contact_no VARCHAR(20),
      admission_year VARCHAR(10),
      prev_school_name VARCHAR(255),
      address TEXT NOT NULL,
      school_id INT NOT NULL,
      national_id VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      stud_pic_url VARCHAR(500),
      username VARCHAR(255) UNIQUE,
      hashed_password VARCHAR(255),
      status VARCHAR(20) DEFAULT 'active',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES school_user(id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      school_id INT NOT NULL,
      subject VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      status ENUM('Present','Absent') NOT NULL,
      teacher_id INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student(id),
      FOREIGN KEY (school_id) REFERENCES school_user(id),
      FOREIGN KEY (teacher_id) REFERENCES teacher(id),
      UNIQUE KEY unique_attendance (student_id, subject, date, school_id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS fees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      school_id INT NOT NULL,
      fee_type VARCHAR(100),
      total_amount DECIMAL(10,2) DEFAULT 0,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      discount DECIMAL(10,2) DEFAULT 0,
      fine DECIMAL(10,2) DEFAULT 0,
      balance DECIMAL(10,2) DEFAULT 0,
      payment_date DATE,
      due_date DATE,
      month_for VARCHAR(20),
      academic_year VARCHAR(20),
      payment_mode VARCHAR(50),
      receipt_no VARCHAR(100),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student(id),
      FOREIGN KEY (school_id) REFERENCES school_user(id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      school_id INT NOT NULL,
      fee_type VARCHAR(100),
      total_amount DECIMAL(10,2),
      amount_paid DECIMAL(10,2),
      discount DECIMAL(10,2),
      fine DECIMAL(10,2),
      payment_date DATE,
      due_date DATE,
      month_for VARCHAR(20),
      academic_year VARCHAR(20),
      payment_mode VARCHAR(50),
      receipt_no VARCHAR(100),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student(id),
      FOREIGN KEY (school_id) REFERENCES school_user(id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS fee_payments_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT,
      school_id INT,
      fee_type VARCHAR(100),
      total_amount DECIMAL(10,2),
      amount_paid DECIMAL(10,2),
      discount DECIMAL(10,2),
      fine DECIMAL(10,2),
      payment_date DATE,
      due_date DATE,
      month_for VARCHAR(20),
      academic_year VARCHAR(20),
      payment_mode VARCHAR(50),
      receipt_no VARCHAR(100),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS timetable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT NOT NULL,
      class_id VARCHAR(50) NOT NULL,
      class_name VARCHAR(100) NOT NULL,
      school_days VARCHAR(255) NOT NULL,
      day VARCHAR(20) NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      subject VARCHAR(100),
      teacher VARCHAR(255),
      room VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES school_user(id)
    )
  `);

  console.log('✅ All 8 tables created');

  // Create test admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  try {
    await conn.query(
      'INSERT INTO school_user (name, email, phone, address, hashed_password) VALUES (?, ?, ?, ?, ?)',
      ['Test School', 'admin@school.com', '9876543210', 'Test Address', hashedPassword]
    );
    console.log('✅ Test admin created → Email: admin@school.com | Password: admin123');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('ℹ️  Test admin already exists');
    } else throw e;
  }

  await conn.end();
  console.log('\n🎯 Setup complete! Now run: node index.js');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
