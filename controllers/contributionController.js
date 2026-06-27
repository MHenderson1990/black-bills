const Contribution = require('../models/Contribution');

//CREATE 
const createContribution = async (req,res) => {
    try { 
        let { savingsGoal, contributedBy, date, amount } = req.body;

        const newContribution = await Contribution.create({
            savingsGoal, 
            contributedBy,
            date, 
            amount

        });

        res.status(201).json(newContribution);
    
    }  catch (error) {
        res.status(500).json({message: error.message });
    }
};


// GET ALL 
const getAllContributions = async (req, res) => {
    try {
        let filter = {savingsGoal: req.query.savingsGoal};

        if (req.query.contributedBy) {
            filter.contributedBy = req.query.contributedBy; 
            }

        const contribution = await Contribution.find(filter);

        res.json(contribution);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


//GET BY CONTRIBUTION ID 
const getContributionById = async (req,res) => {
    try {
        const contribution = await Contribution.findById(req.params.id);
        if (!contribution) return res.status(404).json({message: 'Contribution not found'});
        res.json(contribution);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


//UPDATE CONTRIBUTION
const updateContribution = async (req, res) => {
    try {
        let contribution = await Contribution.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        ); 

        if (!contribution) {
            return res.status(404).json({message: 'Contribution not found'});
        }
        res.json(contribution);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


// DELETE CONTRIBUTION
const deleteContribution = async (req, res) => {
  try {
    let contribution = await Contribution.findByIdAndDelete(req.params.id);

    if (!contribution) {
      return res.status(404).json({ message: 'Contribution not found' });
    }

    res.json({ message: 'Contribution deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { createContribution, getAllContributions, getContributionById, updateContribution, deleteContribution };

