const Paycheck = require('../models/Paycheck');
const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare'); 
const User = require('../models/User'); 

// CREATE PAYCHECK
const createPaycheck = async (req, res) => {
  try {
    let { earnedBy, amount, date, leftoverAmount } = req.body;

    const paycheck = await Paycheck.create({
      earnedBy,
      amount,
      date,
      leftoverAmount
    });

    res.status(201).json(paycheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PAYCHECKS
const getAllPaychecks = async (req, res) => {
  try {
    let filter = { earnedBy: req.query.earnedBy };

    const paychecks = await Paycheck.find(filter);
    res.json(paychecks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PAYCHECK BY ID
const getPaycheckById = async (req, res) => {
  try {
    const paycheck = await Paycheck.findById(req.params.id);
    if (!paycheck) return res.status(404).json({ message: 'Paycheck not found' });
    res.json(paycheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PAYCHECK
const updatePaycheck = async (req, res) => {
  try {
    let paycheck = await Paycheck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!paycheck) {
      return res.status(404).json({ message: 'Paycheck not found' });
    }
    res.json(paycheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PAYCHECK
const deletePaycheck = async (req, res) => {
  try {
    let paycheck = await Paycheck.findByIdAndDelete(req.params.id);

    if (!paycheck) {
      return res.status(404).json({ message: 'Paycheck not found' });
    }

    res.json({ message: 'Paycheck deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// shared calculation logic
// shared calculation logic
async function computeLeftoverForPaycheck(paycheck) {
  let periodStart = new Date(paycheck.date);
  let periodEnd = new Date(periodStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  let allBillShares = await BillShare.find({ owner: paycheck.earnedBy });

  let billShareTotal = 0;
  for (let share of allBillShares) {
    let parentBill = await Bill.findById(share.bill);
    if (!parentBill || !parentBill.dueDate) continue;
    if (parentBill.isSetAside) continue;
    if (parentBill.dueDate >= periodStart && parentBill.dueDate < periodEnd) {
      billShareTotal = billShareTotal + share.amount;
    }
  }

  let personalBills = await Bill.find({
    owner: paycheck.earnedBy,
    isShared: false,
    isSetAside: { $ne: true },
    dueDate: { $gte: periodStart, $lt: periodEnd }
  });

  let personalBillsTotal = personalBills.reduce((total, personal) => {
    return total + personal.amount;
  }, 0);

  let leftoverAmount = paycheck.amount - (billShareTotal + personalBillsTotal);
  return await Paycheck.findByIdAndUpdate(paycheck._id, { leftoverAmount }, { new: true });
}

//LEFTOVER AMOUNT
const calculatePaycheckLeftover = async (req, res) => {
  try {
    const paycheck = await Paycheck.findById(req.params.id);
    if (!paycheck) return res.status(404).json({ message: 'Paycheck not found' });

    let updatedPaycheck = await computeLeftoverForPaycheck(paycheck);
    res.json(updatedPaycheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//RECALCULATE MOST RECENT PAYCHECK FOR A USER
const recalculateLeftover = async (req, res) => {
  try {
    let recentPaycheck = await Paycheck.findOne({ earnedBy: req.query.earnedBy }).sort({ date: -1 });
    if (!recentPaycheck) return res.json({ message: 'No paychecks yet' });

    let updatedPaycheck = await computeLeftoverForPaycheck(recentPaycheck);
    res.json(updatedPaycheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET NEXT PAY DATE 
const getNextPayDate = async (req, res) => {
  try {
    // 1. find the user
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });


    // 2. if no payAnchorDate set, return a helpful message
    if (!user.payAnchorDate) {
      return res.json({message: 'No Pay schedule set yet'});
    };

    // 3. run the while loop
    let fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
    let nextPayDate = new Date(user.payAnchorDate);

    while (nextPayDate < new Date()) {
    nextPayDate = new Date(nextPayDate.getTime() + fourteenDaysInMs);
  };

    // 4. respond with nextPayDate
    res.json({nextPayDate});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET RECENT PAY DATE 
const getRecentPayDate = async (req, res) => {
  try {
    // 1. find the user
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });


    // 2. if no payAnchorDate set, return a helpful message
    if (!user.payAnchorDate) {
      return res.json({message: 'No Pay schedule set yet'});
    };

    // 3. run the while loop
    let recentPayDate = new Date(user.payAnchorDate);
    let nextPayDate = new Date(user.payAnchorDate);
    let fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000; 
    let oneDayInMs = 24 * 60 * 60 * 1000; 

    while (nextPayDate < new Date()) {
      recentPayDate = new Date(nextPayDate); // save the OLD value first
      nextPayDate = new Date(nextPayDate.getTime() + fourteenDaysInMs); // THEN jump forward
      
}

    let periodEnd = new Date(nextPayDate.getTime() - oneDayInMs);

    // 4. respond with recentPayDate
    res.json({recentPayDate, periodEnd});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { createPaycheck, getAllPaychecks, getPaycheckById, updatePaycheck, deletePaycheck, calculatePaycheckLeftover, getNextPayDate, getRecentPayDate, recalculateLeftover };