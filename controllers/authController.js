const User = require('../models/User');

const registerUser = async (req, res) => {
    console.log('Register route hit');
    console.log('Request body:', req.body);

    try {
        const { name, email, password, householdId } = req.body;

        const userExists = await User.findOne({email});
        if (userExists) {
            return res.status(400).json({message: 'User already exists'});
        }

        const user = await User.create({
            name, 
            email,
            password,
            householdId
        });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email, 
        });
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).json({message:error.message});
    }
};

const loginUser = async (req, res) => {
    console.log('Login route hit');
    console.log('Request body:', req.body);

    try {
        const { email, password } = req.body;

        const user = await User.findOne({email});

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({message: 'Invalid email or password'});
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            householdId: user.householdId
        });
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).json({message: error.message});
    }
};

module.exports = { registerUser, loginUser };