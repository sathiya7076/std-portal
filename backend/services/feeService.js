const Fee = require("../models/Fee");
const Payment = require("../models/Payment");

/**
 * Computes total pending fee amount across all fee records for a student.
 * Pending Amount = Total Fees - Paid Amount
 */
const getStudentFeeSummary = async (studentId) => {
  const feeRecords = await Fee.find({ studentId });

  const totalFees = feeRecords.reduce((sum, f) => sum + f.totalFees, 0);
  const paidAmount = feeRecords.reduce((sum, f) => sum + f.paidAmount, 0);
  const pendingAmount = Math.max(totalFees - paidAmount, 0);

  const payments = await Payment.find({ studentId }).sort({ paidAt: -1 });
  const history = payments.map((p) => ({
    date: p.paidAt.toISOString().slice(0, 10),
    amount: p.amount,
    method: p.method,
    status: "Paid",
    receiptNumber: p.receiptNumber,
    transactionRef: p.transactionRef,
    feeId: p.feeId,
  }));

  return { totalFees, paidAmount, pendingAmount, records: feeRecords, history };
};

/**
 * Applies a payment amount to a fee record, capping paidAmount at totalFees.
 */
const applyPaymentToFee = async (feeId, amount) => {
  const fee = await Fee.findById(feeId);
  if (!fee) return null;

  fee.paidAmount = Math.min(fee.paidAmount + amount, fee.totalFees);
  await fee.save();
  return fee;
};

module.exports = { getStudentFeeSummary, applyPaymentToFee };