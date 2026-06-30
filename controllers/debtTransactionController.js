const DebtTransaction = require('../models/DebtTransaction');

//CREATE 
const createDebtTransaction = async (req,res) => {
    try { 
        let { debt, item, madeBy, date, amount, category } = req.body;

        const debtTransaction = await DebtTransaction.create({
            debt, 
            item,
            madeBy,
            date, 
            amount,
            category

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


module.exports = { createDebtTransaction, getAllDebtTransactions, getDebtTransactionById, updateDebtTransaction, deleteDebtTransaction };

