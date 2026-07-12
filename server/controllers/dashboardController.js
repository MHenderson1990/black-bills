const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare');
const DebtTransaction = require('../models/DebtTransaction');
const BillPayment = require('../models/BillPayment');
const User = require('../models/User');

const getSpendingByCategory = async (req, res) => {
  try {
    let { owner, start, end, mode, householdId } = req.query;
    let cashflow = mode === 'cashflow';

    // HOUSEHOLD MODE: everyone's spending, shared bills counted once at full amount
    if (mode === 'household') {
      let bills = await Bill.find({
        householdId,
        isSetAside: { $ne: true },
        dueDate: { $gte: start, $lte: end }
      });

      let grouped = bills.reduce((totals, bill) => {
        if (!totals[bill.category]) {
          totals[bill.category] = 0;
        }
        totals[bill.category] = totals[bill.category] + bill.amount;
        return totals;
      }, {});

      let members = await User.find({ householdId }).select('_id');
      let memberIds = members.map(m => m._id);

      let debtTransactions = await DebtTransaction.find({
        madeBy: { $in: memberIds },
        date: { $gte: start, $lte: end }
      });

      for (let transaction of debtTransactions) {
        if (!grouped[transaction.category]) {
          grouped[transaction.category] = 0;
        }
        grouped[transaction.category] = grouped[transaction.category] + transaction.amount;
      }

      return res.json(grouped);
    }

    
    // bills WITH payments: count each payment at its payment date
    let windowPayments = await BillPayment.find({
      date: { $gte: new Date(start), $lte: new Date(end) }
    });

    let grouped = {};

    for (let payment of windowPayments) {
      let bill = await Bill.findById(payment.bill);
      if (!bill || String(bill.owner) !== owner || bill.isShared || bill.isSetAside) continue;
      if (!grouped[bill.category]) grouped[bill.category] = 0;
      grouped[bill.category] = grouped[bill.category] + payment.amount;
    }

    // bills WITHOUT any payments: count full amount at due date (the old rule)
    let personalBills = await Bill.find({
      owner,
      isShared: false,
      isSetAside: { $ne: true },
      dueDate: { $gte: start, $lte: end }
    });

    for (let bill of personalBills) {
      let anyPayments = await BillPayment.countDocuments({ bill: bill._id });
      if (anyPayments > 0) continue; // counted via payments instead
      if (!grouped[bill.category]) grouped[bill.category] = 0;
      grouped[bill.category] = grouped[bill.category] + bill.amount;
    }

    let billShares = await BillShare.find({ owner });

    for (let share of billShares) {
      let parentBill = await Bill.findById(share.bill);

      if (!parentBill || !parentBill.dueDate) continue;
      if (parentBill.isSetAside) continue;

      if (parentBill.dueDate >= new Date(start) && parentBill.dueDate <= new Date(end)) {
        if (!grouped[parentBill.category]) {
          grouped[parentBill.category] = 0;
        }
        grouped[parentBill.category] = grouped[parentBill.category] + share.amount;
      }
    }

    let debtTransactions = await DebtTransaction.find({
      madeBy: owner,
      date: { $gte: start, $lte: end }
    });

    for (let transaction of debtTransactions) {
      if (!grouped[transaction.category]) {
        grouped[transaction.category] = 0;
      }
      grouped[transaction.category] = grouped[transaction.category] + transaction.amount;
    }

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { getSpendingByCategory }; 
