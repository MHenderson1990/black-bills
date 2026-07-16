const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare');
const { recalcHouseholdLeftovers } = require('../utils/recalcHousehold');
const User = require('../models/User');

// CREATE BILL
const createBill = async (req, res) => {
  try {
    let { name, amount, dueDate, category, isShared, owner, householdId, paymentMethod, isRecurring, isSetAside, recurrenceType, linkedDebt,
      isAutopay } = req.body;

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
      linkedDebt,
      isAutopay
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
    await recalcHouseholdLeftovers(householdId);
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

function nextFourWeeks(date) {
  let d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 28);
  return d;
}

// GET ALL BILLS 
const getAllBills = async (req, res) => {
  try {
    // rollover: clone paid+past-due recurring bills forward, archive the old ones.
    // wrapped separately so a rollover failure can't break the fetch.
    try {
      let dueForRollover = await Bill.find({
        householdId: req.query.householdId,
        isRecurring: true,
        paid: true,
        dueDate: { $lt: new Date() }
      });

      for (let bill of dueForRollover) {
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

        bill.isRecurring = false;
        bill.isArchived = true;
        await bill.save();
      }
    } catch (rolloverError) {
      console.error('Rollover failed:', rolloverError);
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

    const bills = await Bill.find(filter).lean();

    // attach payment summaries so the frontend can show progress and window-relevance
    const BillPayment = require('../models/BillPayment');
    for (let bill of bills) {
      let payments = await BillPayment.find({ bill: bill._id });
      bill.paidSoFar = payments.reduce((total, p) => total + p.amount, 0);
      bill.paymentDates = payments.map(p => p.date);
    }

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
    await recalcHouseholdLeftovers(bill.householdId);
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//DELETE BILL 
const deleteBill = async (req, res) => {
  try {
    const BillPayment = require('../models/BillPayment');
    const DebtPayment = require('../models/DebtPayment');

    let billPayments = await BillPayment.find({ bill: req.params.id });
    for (let bp of billPayments) {
      await DebtPayment.findOneAndDelete({ billPayment: bp._id });
    }
    await BillPayment.deleteMany({ bill: req.params.id });

    let bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await BillShare.deleteMany({ bill: req.params.id });
    await recalcHouseholdLeftovers(bill.householdId);
    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBill, getAllBills, getBillById, updateBill, deleteBill };