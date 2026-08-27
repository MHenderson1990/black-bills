const DebtTransaction = require('../models/DebtTransaction');
const Debt = require('../models/Debt');
const DebtPayment = require('../models/DebtPayment');

async function getPaidSoFar(transactionId) {
  let payments = await DebtPayment.find({ transaction: transactionId });
  return payments.reduce((total, p) => total + p.amount, 0);
}

async function getOwedByMember(debtId) {
  let transactions = await DebtTransaction.find({
    debt: debtId,
    madeByBoth: { $ne: true },
    paid: { $ne: true }
  });

  let owedByMember = {};
  for (let t of transactions) {
    let paidSoFar = await getPaidSoFar(t._id);
    let remaining = t.amount - paidSoFar;
    if (remaining > 0) {
      owedByMember[t.madeBy] = (owedByMember[t.madeBy] || 0) + remaining;
    }
  }
  return owedByMember;
}

const getOwedByMemberForDebt = async (req, res) => {
  try {
    let owed = await getOwedByMember(req.params.debtId);
    res.json(owed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//CREATE 
const createDebtTransaction = async (req,res) => {
    try { 
        let { debt, item, madeBy, date, amount, category, madeByBoth, fromBudget } = req.body;

        if (madeByBoth) {
            const User = require('../models/User');
            let debtDoc = await Debt.findById(debt);
            let members = await User.find({ householdId: debtDoc.householdId });
            let half = amount / 2;

            let created = [];
            for (let m of members) {
                let charge = await DebtTransaction.create({
                    debt,
                    item,
                    madeBy: m._id,
                    date,
                    amount: half,
                    category,
                    madeByBoth: false,
                    fromBudget
                });
                created.push(charge);
            }
            return res.status(201).json(created);
        }

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

        const debtTransactions = await DebtTransaction.find(filter);
        let enriched = [];
        for (let t of debtTransactions) {
            let paidSoFar = await getPaidSoFar(t._id);
            enriched.push({ ...t.toObject(), paidSoFar });
        }
        res.json(enriched);

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
const markTransactionPaid = async (req, res) => {
  try {
    let transaction = await DebtTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Debt Transaction not found' });
    }
    if (transaction.paid) {
      return res.status(400).json({ message: 'Transaction already marked paid' });
    }

    let alreadyPaid = await getPaidSoFar(transaction._id);
    await DebtPayment.create({
      debt: transaction.debt,
      madeBy: transaction.madeBy,
      date: new Date(),
      amount: transaction.amount - alreadyPaid,
      transaction: transaction._id
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
const getMySharedCharges = async (req, res) => {
  try {
    let { householdId, userId } = req.query;

    let sharedDebts = await Debt.find({
      householdId,
      $or: [{ isShared: true }, { owner: userId }]
    });
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

    let result = [];
    for (let t of transactions) {
      let paidSoFar = await getPaidSoFar(t._id);
      result.push({
        ...t.toObject(),
        debtName: debtNameById[String(t.debt)],
        paidSoFar
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  // derive a transaction's paid status from its linked payments
const syncTransactionPaidStatus = async (transactionId) => {
  let totalPaid = await getPaidSoFar(transactionId);
  let transaction = await DebtTransaction.findById(transactionId);

  if (!transaction) return;
  let shouldBePaid = totalPaid >= transaction.amount;

  if (transaction.paid !== shouldBePaid) {
    transaction.paid = shouldBePaid;
    transaction.paidDate = shouldBePaid ? new Date() : undefined;
    await transaction.save();
  }
};

// LOG PARTIAL PAYMENT against a transaction
const payTransactionPartial = async (req, res) => {
  try {
    let { amount, date } = req.body;
    let transaction = await DebtTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Debt Transaction not found' });
    }

    await DebtPayment.create({
      debt: transaction.debt,
      transaction: transaction._id,
      madeBy: transaction.madeBy,
      date: date || new Date(),
      amount: Number(amount)
    });

    await syncTransactionPaidStatus(transaction._id);
    let updated = await DebtTransaction.findById(transaction._id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET payments linked to a transaction
const getTransactionPayments = async (req, res) => {
  try {
    let payments = await DebtPayment.find({ transaction: req.params.id });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDebtTransaction, getAllDebtTransactions, getDebtTransactionById, updateDebtTransaction, 
    deleteDebtTransaction, markTransactionPaid, getMySharedCharges, syncTransactionPaidStatus, payTransactionPartial, 
    getTransactionPayments, getOwedByMemberForDebt };

