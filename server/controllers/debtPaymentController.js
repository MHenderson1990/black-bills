const DebtPayment = require('../models/DebtPayment');

//CREATE 
const createDebtPayment = async (req,res) => {
    try { 
        let { debt, madeBy, date, amount, transaction, billName } = req.body;

        const debtPayment = await DebtPayment.create({
            debt, 
            madeBy,
            date, 
            amount,
            transaction,
            billName

        });

        if (debtPayment.transaction) {
            let { syncTransactionPaidStatus } = require('./debtTransactionController');
            await syncTransactionPaidStatus(debtPayment.transaction);
        }

        res.status(201).json(debtPayment);
    
    }  catch (error) {
        res.status(500).json({message: error.message });
    }
};


// GET ALL 
const getAllDebtPayments = async (req, res) => {
    try {
        let filter = {debt: req.query.debt};

        if (req.query.madeBy) {
            filter.madeBy = req.query.madeBy; 
            }

        const debtPayments = await DebtPayment.find(filter).populate('transaction', 'item');
        res.json(debtPayments);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


//GET BY DEBT PAYMENT ID 
const getDebtPaymentById = async (req,res) => {
    try {
        const debtPayment = await DebtPayment.findById(req.params.id);
        if (!debtPayment) return res.status(404).json({message: 'Debt Payment not found'});
        res.json(debtPayment);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


//UPDATE DEBT PAYMENT
const updateDebtPayment = async (req, res) => {
    try {
        let debtPayment = await DebtPayment.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        ); 

        if (!debtPayment) {
            return res.status(404).json({message: 'Debt Payment not found'});
        }

        if (debtPayment.transaction) {
            let { syncTransactionPaidStatus } = require('./debtTransactionController');
            await syncTransactionPaidStatus(debtPayment.transaction);
        }
        res.json(debtPayment);

        if (debtPayment.billPayment) {
      const BillPayment = require('../models/BillPayment');
      const { syncBillPaidStatus } = require('./billPaymentController');
      let deletedBillPayment = await BillPayment.findByIdAndDelete(debtPayment.billPayment);
      if (deletedBillPayment) {
        await syncBillPaidStatus(deletedBillPayment.bill);
      }
    }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


// DELETE DEBT PAYMENT
const deleteDebtPayment = async (req, res) => {
  try {
    let debtPayment = await DebtPayment.findByIdAndDelete(req.params.id);

    if (!debtPayment) {
      return res.status(404).json({ message: 'Debt Payment not found' });
    }
    if (debtPayment.transaction) {
            let { syncTransactionPaidStatus } = require('./debtTransactionController');
            await syncTransactionPaidStatus(debtPayment.transaction);
        }
    res.json({ message: 'Debt Payment deleted' });

    if (debtPayment.billPayment) {
      const BillPayment = require('../models/BillPayment');
      const { syncBillPaidStatus } = require('./billPaymentController');
      let deletedBillPayment = await BillPayment.findByIdAndDelete(debtPayment.billPayment);
      if (deletedBillPayment) {
        await syncBillPaidStatus(deletedBillPayment.bill);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { createDebtPayment, getAllDebtPayments, getDebtPaymentById, updateDebtPayment, deleteDebtPayment };

