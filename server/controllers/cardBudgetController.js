const CardBudget = require('../models/CardBudget');
const DebtTransaction = require('../models/DebtTransaction');

// SET (create or update) the budget for a card + period
const setCardBudget = async (req, res) => {
  try {
    let { householdId, debt, amount, periodStart } = req.body;

    let budget = await CardBudget.findOneAndUpdate(
      { householdId, debt, periodStart },
      { amount },
      { new: true, upsert: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET budget + spend summary for a card + period
const getCardBudgetSummary = async (req, res) => {
  try {
    let { householdId, debt, periodStart, periodEnd } = req.query;

    let budget = await CardBudget.findOne({
      householdId,
      debt,
      periodStart: new Date(periodStart)
    });

    let purchases = await DebtTransaction.find({
      debt,
      fromBudget: true,
      date: { $gte: new Date(periodStart), $lt: new Date(periodEnd) }
    });

    let spent = purchases.reduce((total, p) => total + p.amount, 0);

    res.json({
      budgetAmount: budget ? budget.amount : 0,
      spent,
      remaining: (budget ? budget.amount : 0) - spent,
      purchases
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET past budgets for a card (history)
const getCardBudgetHistory = async (req, res) => {
  try {
    let { householdId, debt } = req.query;
    let budgets = await CardBudget.find({ householdId, debt }).sort({ periodStart: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { setCardBudget, getCardBudgetSummary, getCardBudgetHistory };