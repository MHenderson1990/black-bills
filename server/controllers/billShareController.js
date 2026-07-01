const BillShare = require('../models/BillShare');
const Bill = require('../models/Bill');

const markBillSharePaid = async (req, res) => {
  try {
   
    let share = await BillShare.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

    if (!share) {
        return res.status(404).json({message: 'Share not found'})
    }

   let allShares = await BillShare.find({ bill: share.bill });
   let allPaid = allShares.every(s => s.paid === true);

    if(allPaid) {
        await Bill.findByIdAndUpdate(share.bill, {paid: true});
    }

    res.json(share);
   
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

      const getAllBillShares = async (req, res) => {
        try {
          let filter = {};
          if (req.query.bill) filter.bill = req.query.bill;
          const billShares = await BillShare.find(filter);
          res.json(billShares);
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      };

module.exports = { markBillSharePaid, getAllBillShares };




    

    