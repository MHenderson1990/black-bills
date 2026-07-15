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

      let monthsElapsed = 0;
      let created = new Date(debt.createdAt);
      let now = new Date();
      let cursor = new Date(created.getFullYear(), created.getMonth() + 1, 1);
      while (cursor <= now) {
        monthsElapsed = monthsElapsed + 1;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      let balanceBeforeInterest = debt.startingBalance + transactionTotal - paymentTotal;
      let interestAccrued = balanceBeforeInterest > 0
        ? balanceBeforeInterest * (debt.interestRate / 100 / 12) * monthsElapsed
        : 0;

      let balance = balanceBeforeInterest + interestAccrued;
        res.json({
        balance,
        startingBalance: debt.startingBalance,
        totalCharged: transactionTotal,
        totalPaid: paymentTotal,
        interestAccrued
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};


//GET AVERAGE PAYMENT 
const getAveragePayment = async (req, res) => {
  try {
    // get debt by ID 
     const debt = await Debt.findById(req.params.id);
        if (!debt) return res.status(404).json({message: 'Debt not found'});

    let recentPayments = await DebtPayment.find({ debt: req.params.id })
      .sort({ date: -1 })
      .limit(3);

      if (recentPayments.length === 0) {
      return res.json({ averagePayment: 0 });
    }

      let paymentTotal = recentPayments.reduce((total, p) => {
      return total + p.amount;}, 0);
        let average = paymentTotal / recentPayments.length;

        res.json({ averagePayment:average});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET PAYOFF CALCULATION 
const getDebtPayoffProjection = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    // you need the CURRENT BALANCE here — same logic as
    // getDebtBalance (find transactions, find payments, combine)
    const debtTransactions = await DebtTransaction.find({ debt: req.params.id });
      let transactionTotal = debtTransactions.reduce((total, t) => {
              return total + t.amount;
            }, 0);

     const debtPayment = await DebtPayment.find({ debt: req.params.id });
      let paymentTotal = debtPayment.reduce((total, p) => {
            return total + p.amount;
          }, 0);

      let balance = debt.startingBalance + transactionTotal - paymentTotal;

      

    // you need the AVERAGE PAYMENT here — same logic as
    // getAveragePayment (find recent payments, sum, divide)
    let recentPayments = await DebtPayment.find({ debt: req.params.id })
      .sort({ date: -1 })
      .limit(3);

      if (recentPayments.length === 0) {
        return res.json({ monthsToPayoff: null, message: 'Not enough payment history yet' });
}

    let recentTotal = recentPayments.reduce((total, p) => {
      return total + p.amount;
  }, 0);

    let averagePayment = recentTotal / recentPayments.length;

    // then run the while loop using both of those numbers
    let monthsToPayoff = 0;
    let runningBalance = balance;
    let monthlyRate = (debt.interestRate / 100) / 12;

    while (runningBalance > 0 && monthsToPayoff < 1200) {
      runningBalance = runningBalance + (runningBalance * monthlyRate);
      runningBalance = runningBalance - averagePayment;
      monthsToPayoff = monthsToPayoff + 1;
    }

    if (runningBalance > 0) {
      return res.json({ monthsToPayoff: null, averagePayment, message: 'Payment too low to outpace interest' });
    }

    res.json({ monthsToPayoff, averagePayment });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { createDebt, getAllDebts, getDebtById, updateDebt, deleteDebt, getDebtBalance, getAveragePayment, getDebtPayoffProjection };
