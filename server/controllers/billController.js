const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare');
const User = require('../models/User');

// CREATE BILL
const createBill = async (req, res) => {
  try {
    let { name, amount, dueDate, category, isShared, owner, householdId, paymentMethod, isRecurring, isSetAside, recurrenceType } = req.body;

    const bill = await Bill.create({
      householdId,
      name,
      amount,
      dueDate,
      category,
      isShared,
      owner,
      paymentMethod,
      isRecurring,
      isSetAside,
      recurrenceType,
    });

    if (isShared) {
      const allUsers = await User.find({ householdId });
      let splitAmount = amount / allUsers.length;

      for (let user of allUsers) {
        await BillShare.create({
          bill: bill._id,
          owner: user._id,
          amount: splitAmount
        });
      }
    }

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// helper: advance a date one month, clamping the day (Jan 31 → Feb 28, not Mar 3)
function nextMonth(date) {
  let d = new Date(date);
  let day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  let daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInMonth));
  return d;
}

// GET ALL BILLS 
const getAllBills = async (req, res) => {
  try {
    // Roll forward any recurring bills that are paid and past due
    let dueForRollover = await Bill.find({
      householdId: req.query.householdId,
      isRecurring: true,
      paid: true,
      dueDate: { $lt: new Date() }
    });

    for (let bill of dueForRollover) {
      // create next occurrence as a NEW bill
      let nextDueDate = bill.recurrenceType === '4weeks' ? nextFourWeeks(bill.dueDate) : nextMonth(bill.dueDate);

      let newBill = await Bill.create({
        householdId: bill.householdId,
        name: bill.name,
        amount: bill.amount,
        dueDate: nextDueDate,
        category: bill.category,
        isShared: bill.isShared,
        owner: bill.owner,
        paymentMethod: bill.paymentMethod,
        isRecurring: true,
        recurrenceType: bill.recurrenceType,
        isSetAside: bill.isSetAside
      });

      // fresh splits for the new occurrence, copying the old split amounts
      if (bill.isShared) {
        let oldShares = await BillShare.find({ bill: bill._id });
        for (let share of oldShares) {
          await BillShare.create({
            bill: newBill._id,
            owner: share.owner,
            amount: share.amount
          });
        }
      }

      // retire the old occurrence as a permanent record
      bill.isRecurring = false;
      bill.isArchived = true;
      await bill.save();
    }

    let filter = { householdId: req.query.householdId };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.isShared !== undefined) {
      filter.isShared = req.query.isShared === 'true';
    }

    if (req.query.owner) {
      filter.owner = req.query.owner;
    }

    if (req.query.includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    const bills = await Bill.find(filter);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET BILLS BY ID
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE BILL
const updateBill = async (req, res) => {
  try {
    let bill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.isShared) {
      let billShares = await BillShare.find({ bill: bill._id });
      let splitAmount = bill.amount / billShares.length;

      for (let share of billShares) {
        await BillShare.findByIdAndUpdate(share._id, { amount: splitAmount });
      }
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//DELETE BILL 
const deleteBill = async (req, res) => {
  try {
    let bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await BillShare.deleteMany({ bill: req.params.id });

    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBill, getAllBills, getBillById, updateBill, deleteBill };