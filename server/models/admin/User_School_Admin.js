const db = require("../../database/db");

async function createSchoolUser(data) {
  const {
    name,
    email,
    phone,
    address,
    logo_url,
    subscription_plan,
    hashed_password,
  } = data;
  const [result] = await db.execute(
    `INSERT INTO school_user 
      (name, email, phone, address, logo_url, subscription_plan, hashed_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, email, phone, address, logo_url, subscription_plan, hashed_password]
  );
  return result;
}

async function getAllSchoolUsers() {
  const [rows] = await db.execute(
    "SELECT id, name, email, phone, address, logo_url, subscription_plan, created_at, updated_at FROM school_user"
  );
  return rows;
}

async function getSchoolUserById(id) {
  const [rows] = await db.execute(
    "SELECT id, name, email, phone, address, logo_url, subscription_plan, created_at, updated_at FROM school_user WHERE id = ?",
    [id]
  );
  return rows[0];
}

async function updateSchoolUser(id, data) {
  const allowedFields = [
    "name",
    "email",
    "phone",
    "address",
    "logo_url",
    "subscription_plan",
    "hashed_password",
  ];

  const fieldsToUpdate = [];
  const values = [];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  fieldsToUpdate.push("updated_at = NOW()");

  const sql = `UPDATE school_user SET ${fieldsToUpdate.join(
    ", "
  )} WHERE id = ?`;
  values.push(id);

  const [result] = await db.execute(sql, values);
  return result;
}

async function deleteSchoolUser(id) {
  const [result] = await db.execute("DELETE FROM school_user WHERE id = ?", [
    id,
  ]);
  return result;
}

module.exports = {
  createSchoolUser,
  getAllSchoolUsers,
  getSchoolUserById,
  updateSchoolUser,
  deleteSchoolUser,
};
