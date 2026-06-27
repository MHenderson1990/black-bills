const Paycheck = require('../models/Paycheck');

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

module.exports = { createPaycheck, getAllPaychecks, getPaycheckById, updatePaycheck, deletePaycheck };