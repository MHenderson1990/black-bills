const DebtTransaction = require('../models/DebtTransaction');

//CREATE 
const createDebtTransaction = async (req,res) => {
    try { 
        let { debt, item, madeBy, date, amount, category, madeByBoth, fromBudget } = req.body;

        const debtTransaction = await DebtTransaction.create({
            debt, 
            item,
            madeBy,
            date, 
            amount,
            category,
            madeByBoth,
            fromBudget

        });

        res.status(201).json(debtTransaction);
    
    }  catch (error) {
        res.status(500).json({message: error.message });
    }
};


// GET ALL TRANSACTIONS
const getAllDebtTransactions = async (req, res) => {
    try {
        let filter = {debt: req.query.debt};

        if (req.query.madeBy) {
            filter.madeBy = req.query.madeBy; 
            }

        if (req.query.fromBudget === 'true') {
            filter.fromBudget = true;
        }
        
        if (req.query.start && req.query.end) {
            filter.date = { $gte: new Date(req.query.start), $lt: new Date(req.query.end) };
        }

        const debtTransaction = await DebtTransaction.find(filter);

        res.json(debtTransaction);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


//GET BY DEBT TRANSACTION ID 
const getDebtTransactionById = async (req,res) => {
    try {
        const debtTransaction = await DebtTransaction.findById(req.params.id);
        if (!debtTransaction) return res.status(404).json({message: 'Debt Transaction not found'});
        res.json(debtTransaction);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


//UPDATE DEBT TRANSACTION
const updateDebtTransaction = async (req, res) => {
    try {
        let debtTransaction = await DebtTransaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        ); 

        if (!debtTransaction) {
            return res.status(404).json({message: 'Debt Transaction not found'});
        }
        res.json(debtTransaction);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


// DELETE DEBT TRANSACTION
const deleteDebtTransaction = async (req, res) => {
  try {
    let debtTransaction = await DebtTransaction.findByIdAndDelete(req.params.id);

    if (!debtTransaction) {
      return res.status(404).json({ message: 'Debt Transaction not found' });
    }

    res.json({ message: 'Debt Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MARK TRANSACTION PAID: flags it and logs a matching DebtPayment
const DebtPayment = require('../models/DebtPayment');

const markTransactionPaid = async (req, res) => {
  try {
    let transaction = await DebtTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Debt Transaction not found' });
    }
    if (transaction.paid) {
      return res.status(400).json({ message: 'Transaction already marked paid' });
    }

    await DebtPayment.create({
      debt: transaction.debt,
      madeBy: transaction.madeBy,
      date: new Date(),
      amount: transaction.amount
    });

    transaction.paid = true;
    transaction.paidDate = new Date();
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY UNPAID CHARGES ON SHARED DEBTS (for the personal checklist)
const Debt = require('../models/Debt');

const getMySharedCharges = async (req, res) => {
  try {
    let { householdId, userId } = req.query;

    let sharedDebts = await Debt.find({ householdId, isShared: true });
    let sharedDebtIds = sharedDebts.map(d => d._id);

    let transactions = await DebtTransaction.find({
      debt: { $in: sharedDebtIds },
      madeBy: userId,
      madeByBoth: { $ne: true },
    });

    // attach the debt name so the frontend can label each row
    let debtNameById = {};
    for (let d of sharedDebts) {
      debtNameById[String(d._id)] = d.name;
    }
    let result = transactions.map(t => ({
      ...t.toObject(),
      debtName: debtNameById[String(t.debt)]
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDebtTransaction, getAllDebtTransactions, getDebtTransactionById, updateDebtTransaction, 
    deleteDebtTransaction, markTransactionPaid, getMySharedCharges };

