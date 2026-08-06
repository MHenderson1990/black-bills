require('dotenv').config();
const mongoose = require('mongoose');
const DebtTransaction = require('../models/DebtTransaction');
const DebtPayment = require('../models/DebtPayment');
const Debt = require('../models/Debt');
const User = require('../models/User');

async function syncPaid(transactionId) {
  let payments = await DebtPayment.find({ transaction: transactionId });
  let totalPaid = payments.reduce((total, p) => total + p.amount, 0);
  let transaction = await DebtTransaction.findById(transactionId);
  if (!transaction) return;
  let shouldBePaid = totalPaid >= transaction.amount;
  transaction.paid = shouldBePaid;
  transaction.paidDate = shouldBePaid ? new Date() : undefined;
  await transaction.save();
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  let bothCharges = await DebtTransaction.find({ madeByBoth: true });
  console.log(`Migrating ${bothCharges.length} Both-flagged charge(s)...\n`);

  for (let charge of bothCharges) {
    let debtDoc = await Debt.findById(charge.debt);
    let members = await User.find({ householdId: debtDoc.householdId });
    let half = charge.amount / 2;

    let newHalves = {};
    for (let m of members) {
      let newCharge = await DebtTransaction.create({
        debt: charge.debt,
        item: charge.item,
        madeBy: m._id,
        date: charge.date,
        amount: half,
        category: charge.category,
        madeByBoth: false,
        fromBudget: charge.fromBudget || false
      });
      newHalves[String(m._id)] = newCharge._id;
    }

    let payments = await DebtPayment.find({ transaction: charge._id });
    for (let p of payments) {
      let targetHalf = newHalves[String(p.madeBy)];
      if (targetHalf) {
        p.transaction = targetHalf;
        await p.save();
      } else {
        console.log(`  WARNING: payment ${p._id} on "${charge.item}" has madeBy not matching any household member — left unlinked`);
      }
    }

    for (let m of members) {
      await syncPaid(newHalves[String(m._id)]);
    }

    await DebtTransaction.findByIdAndDelete(charge._id);
    console.log(`  Migrated: "${charge.item}" ($${charge.amount}) → 2 halves`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

migrate();