const Debt = require('../models/Debt');
const DebtTransaction = require('../models/DebtTransaction');
const DebtPayment = require('../models/DebtPayment');

// CREATE DEBT
const createDebt = async (req, res) => {
  try {
    let { name, isShared, trackTransactions, startingBalance, interestRate, owner, householdId } = req.body;
  
    const debt = await Debt.create({
        householdId,
        name, 
        isShared,
        trackTransactions,
        startingBalance, 
        interestRate, 
        owner
    });
  
    res.status(201).json(debt);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET ALL DEBT
const getAllDebts = async (req, res) => {
    try {
        let filter = {householdId: req.query.householdId};

        if (req.query.isShared) {
            filter.isShared = req.query.isShared === 'true';
        }
        
        if (req.query.owner) {
            filter.owner = req.query.owner; 
            }

        const debts = await Debt.find(filter);

        res.json(debts);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


// GET DEBT BY ID 
const getDebtById = async (req,res) => {
    try {
        const debt = await Debt.findById(req.params.id);
        if (!debt) return res.status(404).json({message: 'Debt not found'});
        res.json(debt);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


// UPDATE DEBT
const updateDebt = async (req, res) => {
    try {
        let debt = await Debt.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        ); 

        if (!debt) {
            return res.status(404).json({message: 'Debt not found'});
        }
        res.json(debt);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


// DELETE DEBT
const deleteDebt = async (req, res) => {
  try {
    let debt = await Debt.findByIdAndDelete(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    await DebtTransaction.deleteMany({ debt: req.params.id });
    await DebtPayment.deleteMany({ debt: req.params.id });

    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  //BALANCE CALCULATION
  const getDebtBalance = async (req, res) => {
  try {
    // 1. find the debt by id
    const debt = await Debt.findById(req.params.id);
        if (!debt) return res.status(404).json({message: 'Debt not found'});

    const debtTransactions = await DebtTransaction.find({ debt: req.params.id });
      let transactionTotal = debtTransactions.reduce((total, t) => {
              return total + t.amount;
            }, 0);

     const debtPayment = await DebtPayment.find({ debt: req.params.id });
      let paymentTotal = debtPayment.reduce((total, p) => {
            return total + p.amount;
          }, 0);

      let balance = debt.startingBalance + transactionTotal - paymentTotal;
          res.json({balance});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};

module.exports = { createDebt, getAllDebts, getDebtById, updateDebt, deleteDebt, getDebtBalance };
