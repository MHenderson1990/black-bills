const BillPayment = require('../models/BillPayment');
const Bill = require('../models/Bill');

// after any payment change, derive the bill's paid status from its payments
async function syncBillPaidStatus(billId) {
  let payments = await BillPayment.find({ bill: billId });
  let totalPaid = payments.reduce((total, p) => total + p.amount, 0);
  let bill = await Bill.findById(billId);
  if (!bill) return;
  let shouldBePaid = totalPaid >= bill.amount;
  if (bill.paid !== shouldBePaid) {
    await Bill.findByIdAndUpdate(billId, { paid: shouldBePaid });
  }
}

// CREATE
const createBillPayment = async (req, res) => {
  try {
    let { bill, amount, date } = req.body;

    const billPayment = await BillPayment.create({ bill, amount, date });
    await syncBillPaidStatus(bill);

    const Bill = require('../models/Bill');
        const DebtPayment = require('../models/DebtPayment');
        let parentBill = await Bill.findById(bill);
        if (parentBill && parentBill.linkedDebt) {
            await DebtPayment.create({
                debt: parentBill.linkedDebt,
                madeBy: parentBill.owner,
                date,
                amount,
                billPayment: billPayment._id,
                billName: parentBill.name
            });
        }

    res.status(201).json(billPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL (by bill)
const getAllBillPayments = async (req, res) => {
  try {
    let filter = { bill: req.query.bill };
    const billPayments = await BillPayment.find(filter);
    res.json(billPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
const updateBillPayment = async (req, res) => {
  try {
    let billPayment = await BillPayment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!billPayment) {
      return res.status(404).json({ message: 'Bill payment not found' });
    }
    await syncBillPaidStatus(billPayment.bill);

    const DebtPayment = require('../models/DebtPayment');
        await DebtPayment.findOneAndUpdate(
            { billPayment: billPayment._id },
            { amount: billPayment.amount, date: billPayment.date }
        );
    

    res.json(billPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
const deleteBillPayment = async (req, res) => {
  try {
    let billPayment = await BillPayment.findByIdAndDelete(req.params.id);

    if (!billPayment) {
      return res.status(404).json({ message: 'Bill payment not found' });
    }
    await syncBillPaidStatus(billPayment.bill);
    const DebtPayment = require('../models/DebtPayment');
        await DebtPayment.findOneAndDelete({ billPayment: req.params.id });
    res.json({ message: 'Bill payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBillPayment, getAllBillPayments, updateBillPayment, deleteBillPayment };