const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare');
const DebtTransaction = require('../models/DebtTransaction');

const getSpendingByCategory = async (req, res) => {
  try {
    let { owner, start, end, mode } = req.query;
    let cashflow = mode === 'cashflow';

    // personal bills (set-asides excluded in both modes)
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

    // shared bill splits
    // default mode: count non-set-aside splits (household expense view)
    // cashflow mode: count ONLY set-aside splits (per-check cash flow view)
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

    // debt transactions count in both modes
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
