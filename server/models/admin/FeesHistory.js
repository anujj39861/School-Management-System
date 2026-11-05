const db = require("../../database/db");

async function logFeeHistory(data) {
  const {
    student_id,
    school_id,
    fee_type ,
    amount_paid,
    payment_date,
    month_for,
    academic_year,
    payment_mode,
    receipt_no,
    remarks,
    total_amount,
    due_date,
    discount,
    fine
  } = data;

  const [result] = await db.execute(
    `INSERT INTO fee_payments (
      student_id, school_id, fee_type, amount_paid,
      payment_date, month_for, academic_year,
      payment_mode, receipt_no, remarks,
      total_amount, due_date, discount, fine
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student_id ,
      school_id,
      fee_type  || null,
      amount_paid,
      payment_date,
      month_for || null,
      academic_year || null,
      payment_mode || null,
      receipt_no || null,
      remarks || null,
      total_amount,
      due_date || null,
      discount || null,
      fine  || null
    ]
  );

  return result;
}

module.exports = {
  logFeeHistory
};
