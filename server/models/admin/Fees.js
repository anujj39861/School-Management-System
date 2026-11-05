const db = require("../../database/db");
const { logFeeHistory } = require("./FeesHistory");

async function createFee(data, school_id) {
  const {
    student_id,
    fee_type,
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

  // Ensure numeric fields are numbers, default to 0
  const sanitizedTotalAmount = typeof total_amount === 'number' ? total_amount : 0;
  const sanitizedAmountPaid = typeof amount_paid === 'number' ? amount_paid : 0;
  const sanitizedDiscount = typeof discount === 'number' ? discount : 0;
  const sanitizedFine = typeof fine === 'number' ? fine : 0;

  const [result] = await db.execute(
    `INSERT INTO fees (
      student_id, school_id, fee_type, amount_paid,
      payment_date, month_for, academic_year,
      payment_mode, receipt_no, remarks,
      total_amount, due_date, discount, fine
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student_id,
      school_id,
      fee_type || null,
      sanitizedAmountPaid,
      payment_date || null,
      month_for || null,
      academic_year || null,
      payment_mode || null,
      receipt_no || null,
      remarks || null,
      sanitizedTotalAmount,
      due_date || null,
      sanitizedDiscount,
      sanitizedFine
    ]
  );

  // await logFeeHistory({
  //   ...data,
  //   total_amount: sanitizedTotalAmount,
  //   amount_paid: sanitizedAmountPaid,
  //   discount: sanitizedDiscount,
  //   fine: sanitizedFine
  // });
  return result;
}

async function getAllFees() {
  const [rows] = await db.execute("SELECT * FROM fees");
  // Sanitize numeric fields
  return rows.map(row => ({
    ...row,
    total_amount: row.total_amount ?? 0,
    amount_paid: row.amount_paid ?? 0,
    discount: row.discount ?? 0,
    fine: row.fine ?? 0,
    balance: row.balance ?? ((row.total_amount ?? 0) - (row.amount_paid ?? 0))
  }));
}

async function getFeeById(id, school_id) {
  const [rows] = await db.execute("SELECT * FROM fees WHERE student_id = ? AND school_id = ?", [id, school_id]);
  // Sanitize numeric fields
  return rows.map(row => ({
    ...row,
    total_amount: row.total_amount ?? 0,
    amount_paid: row.amount_paid ?? 0,
    discount: row.discount ?? 0,
    fine: row.fine ?? 0,
    balance: row.balance ?? ((row.total_amount ?? 0) - (row.amount_paid ?? 0))
  }));
}

async function updateFee(id, data) {
  const {
    student_id,
    school_id,
    fee_type,
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

  // Ensure numeric fields are numbers
  const sanitizedTotalAmount = typeof total_amount === 'number' ? total_amount : 0;
  const sanitizedAmountPaid = typeof amount_paid === 'number' ? amount_paid : 0;
  const sanitizedDiscount = typeof discount === 'number' ? discount : 0;
  const sanitizedFine = typeof fine === 'number' ? fine : 0;

  const [result] = await db.execute(
    `UPDATE fees SET
      student_id=?, school_id=?, fee_type=?, amount_paid=?,
      payment_date=?, month_for=?, academic_year=?,
      payment_mode=?, receipt_no=?, remarks=?,
      total_amount=?, due_date=?, discount=?, fine=?
    WHERE id=?`,
    [
      student_id,
      school_id,
      fee_type,
      sanitizedAmountPaid,
      payment_date,
      month_for,
      academic_year,
      payment_mode,
      receipt_no,
      remarks,
      sanitizedTotalAmount,
      due_date,
      sanitizedDiscount,
      sanitizedFine,
      id
    ]
  );

  return result;
}

async function deleteFee(id) {
  const [result] = await db.execute("DELETE FROM fees WHERE id = ?", [id]);
  return result;
}

module.exports = {
  createFee,
  getAllFees,
  getFeeById,
  updateFee,
  deleteFee,
};
