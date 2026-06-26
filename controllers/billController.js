const Bill = require('../models/Bill');
const BillShare = require('../models/BillShare');
const User = require('../models/User');

const createBill = async (req, res) => {
  try {
    let { name, amount, dueDate, category, isShared, householdId } = req.body;

    const bill = await Bill.create({
      householdId,
      name,
      amount,
      dueDate,
      category,
      isShared
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

const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find({ householdId: req.query.householdId });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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