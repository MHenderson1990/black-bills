const User = require('../models/User');
const Paycheck = require('../models/Paycheck');
const { computeLeftoverForPaycheck } = require('../controllers/paycheckController');

// recalculate the most recent paycheck's leftover for every member of a household
async function recalcHouseholdLeftovers(householdId) {
  try {
    let members = await User.find({ householdId }).select('_id');
    for (let member of members) {
      let recentPaycheck = await Paycheck.findOne({ earnedBy: member._id }).sort({ date: -1 });
      if (recentPaycheck) {
        await computeLeftoverForPaycheck(recentPaycheck);
      }
    }
  } catch (error) {
    console.error('Household leftover recalc failed:', error);
  }
}

module.exports = { recalcHouseholdLeftovers };