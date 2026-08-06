require('dotenv').config();
const mongoose = require('mongoose');
const DebtTransaction = require('../models/DebtTransaction');
const DebtPayment = require('../models/DebtPayment');
const User = require('../models/User');

async function dryRun() {
  await mongoose.connect(process.env.MONGODB_URI);

  let bothCharges = await DebtTransaction.find({ madeByBoth: true });

  console.log(`Found ${bothCharges.length} Both-flagged charge(s).\n`);

  for (let charge of bothCharges) {
    console.log(`Charge: "${charge.item}" — $${charge.amount} on ${charge.date.toISOString().slice(0,10)} (id: ${charge._id})`);
    console.log(`  Would split into two $${(charge.amount / 2).toFixed(2)} charges.`);

    let payments = await DebtPayment.find({ transaction: charge._id });
    if (payments.length === 0) {
      console.log(`  No payments linked to this charge.`);
    } else {
      for (let p of payments) {
        let payer = await User.findById(p.madeBy);
        console.log(`  Payment: $${p.amount} by ${payer ? payer.name : 'UNKNOWN'} on ${p.date.toISOString().slice(0,10)} — would reattach to ${payer ? payer.name : '???'}'s new half-charge`);
      }
    }
    console.log('');
  }

  await mongoose.disconnect();
}

dryRun();