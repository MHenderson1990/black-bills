const SavingsGoal = require('../models/SavingsGoal');

// CREATE SAVINGS GOAL
const createSavingsGoal = async (req, res) => {
  try {
    let { name, isShared, targetAmount, targetDate, startingBalance, owner, householdId } = req.body;

    const savingsGoal = await SavingsGoal.create({
      householdId,
      name,
      isShared,
      targetAmount,
      targetDate,
      startingBalance,
      owner
    });

    res.status(201).json(savingsGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL SAVINGS GOALS
const getAllSavingsGoals = async (req, res) => {
  try {
    let filter = { householdId: req.query.householdId };

    if (req.query.isShared) {
      filter.isShared = req.query.isShared === 'true';
    }

    if (req.query.owner) {
      filter.owner = req.query.owner;
    }

    const savingsGoals = await SavingsGoal.find(filter);
    res.json(savingsGoals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SAVINGS GOAL BY ID
const getSavingsGoalById = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findById(req.params.id);
    if (!savingsGoal) return res.status(404).json({ message: 'Savings goal not found' });
    res.json(savingsGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE SAVINGS GOAL
const updateSavingsGoal = async (req, res) => {
  try {
    let savingsGoal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    res.json(savingsGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SAVINGS GOAL
const deleteSavingsGoal = async (req, res) => {
  try {
    let savingsGoal = await SavingsGoal.findByIdAndDelete(req.params.id);

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    res.json({ message: 'Savings goal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSavingsGoal, getAllSavingsGoals, getSavingsGoalById, updateSavingsGoal, deleteSavingsGoal };