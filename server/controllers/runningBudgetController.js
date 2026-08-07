const RunningBudget = require('../models/RunningBudget');
const RunningBudgetEntry = require('../models/RunningBudgetEntry');

const createBudget = async (req, res) => {
  try {
    let { householdId, name } = req.body;
    const budget = await RunningBudget.create({ householdId, name });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBudgets = async (req, res) => {
  try {
    let budgets = await RunningBudget.find({ householdId: req.query.householdId });
    let withTotals = await Promise.all(
      budgets.map(async (b) => {
        let entries = await RunningBudgetEntry.find({ budget: b._id });
        let total = entries.reduce((sum, e) => sum + (e.type === 'add' ? e.amount : -e.amount), 0);
        return { ...b.toObject(), total };
      })
    );
    res.json(withTotals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    let budget = await RunningBudget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    await RunningBudgetEntry.deleteMany({ budget: req.params.id });
    let budget = await RunningBudget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEntry = async (req, res) => {
  try {
    let { budget, amount, type, note, loggedBy } = req.body;
    const entry = await RunningBudgetEntry.create({ budget, amount, type, note, loggedBy });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEntries = async (req, res) => {
  try {
    let entries = await RunningBudgetEntry.find({ budget: req.query.budget }).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEntry = async (req, res) => {
  try {
    let entry = await RunningBudgetEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEntry = async (req, res) => {
  try {
    let entry = await RunningBudgetEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBudget, getAllBudgets, updateBudget, deleteBudget, createEntry, getEntries, updateEntry, deleteEntry };