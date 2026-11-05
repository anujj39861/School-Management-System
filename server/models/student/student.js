const db = require("../../database/db");
const bcrypt = require('bcrypt');

// ...existing code...

async function getStudentById(id) {
	try {
		const query = `SELECT id, student_id, student_name, class, section, father_name,
			mother_name, dob, gender, contact_no, admission_year, prev_school_name,
			address, school_id, national_id, email, username, status, last_login,
			stud_pic_url, created_at, updated_at
			FROM student WHERE id = ?`;

		const [rows] = await db.execute(query, [id]);
		if (rows.length === 0) {
			throw new Error('Student not found');
		}
		
		const student = rows[0];
		
		// Format the date of birth to YYYY-MM-DD
		if (student.dob) {
			const date = new Date(student.dob);
			student.dob = date.toISOString().split('T')[0];
		}
		
		return student;
	} catch (err) {
		throw new Error(err.message === 'Student not found' ? err.message : `Database error: ${err.message}`);
	}
}

async function updatePassword(id, school_id, newPassword) {
	try {
		if (!newPassword) {
			throw new Error('New password is required');
		}

		// Hash the new password
		const salt = await bcrypt.genSalt(10);
		const hashed_password = await bcrypt.hash(newPassword, salt);

		const params = [hashed_password, id];
		let query = `UPDATE student SET hashed_password = ? WHERE id = ?`;
		if (school_id !== undefined && school_id !== null) {
			query += ` AND school_id = ?`;
			params.push(school_id);
		}

		const [result] = await db.execute(query, params);
		if (result.affectedRows === 0) {
			throw new Error('Student not found');
		}
		return result;
	} catch (err) {
		throw new Error(err.message);
	}
}

module.exports = {
	getStudentById,
	updatePassword,
};


