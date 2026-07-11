const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare');
const DebtTransaction = require('../models/DebtTransaction');
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

    // PERSONAL MODES (default + cashflow) — unchanged
    let personalBills = await Bill.find({
      owner,
      isShared: false,
      isSetAside: { $ne: true },
      dueDate: { $gte: start, $lte: end }
    });

    let grouped = personalBills.reduce((totals, bill) => {
      if (!totals[bill.category]) {
        totals[bill.category] = 0;
      }
      totals[bill.category] = totals[bill.category] + bill.amount;
      return totals;
    }, {});

    let billShares = await BillShare.find({ owner });

    for (let share of billShares) {
      let parentBill = await Bill.findById(share.bill);

      if (!parentBill || !parentBill.dueDate) continue;
      if (cashflow ? !parentBill.isSetAside : parentBill.isSetAside) continue;

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
