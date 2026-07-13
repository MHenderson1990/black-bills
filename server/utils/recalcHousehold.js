const User = require('../models/User');
const Paycheck = require('../models/Paycheck');
const { computeLeftoverForPaycheck } = require('../controllers/paycheckController');

// recalculate the most recent paycheck's leftover for every member of a household
async function recalcHouseholdLeftovers(householdId) {
  try {
    console.log('RECALC FIRING for household:', householdId);
    let members = await User.find({ householdId }).select('_id');
    console.log('RECALC members found:', members.length);
    for (let member of members) {
      let recentPaycheck = await Paycheck.findOne({ earnedBy: member._id }).sort({ date: -1 });
      console.log('RECALC member', String(member._id), 'paycheck:', recentPaycheck ? recentPaycheck._id : 'NONE');
      if (recentPaycheck) {
        let updated = await computeLeftoverForPaycheck(recentPaycheck);
        console.log('RECALC updated leftover:', updated ? updated.leftoverAmount : 'no result');
      }
    }
  } catch (error) {
    console.error('Household leftover recalc failed:', error);
  }
}

module.exports = { recalcHouseholdLeftovers };