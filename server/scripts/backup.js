require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const DebtTransaction = require('../models/DebtTransaction');
const DebtPayment = require('../models/DebtPayment');

async function backup() {
  await mongoose.connect(process.env.MONGODB_URI);

  let transactions = await DebtTransaction.find({});
  let payments = await DebtPayment.find({});

  fs.writeFileSync('./backup-debttransactions.json', JSON.stringify(transactions, null, 2));
  fs.writeFileSync('./backup-debtpayments.json', JSON.stringify(payments, null, 2));

  console.log(`Backed up ${transactions.length} transactions and ${payments.length} payments.`);
  await mongoose.disconnect();
}

backup();