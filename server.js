require('dotenv').config();


const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/authRoutes');
const billRoutes = require('./routes/billRoutes'); 
const debtRoutes = require('./routes/debtRoutes');
const billShareRoutes = require('./routes/billShareRoutes');
const debtTransactionRoutes = require('./routes/debtTransactionRoutes');
const debtPaymentRoutes = require('./routes/debtPaymentRoutes'); 
const savingsGoalRoutes = require('./routes/savingsGoalRoutes'); 
const contributionRoutes = require('./routes/contributionRoutes');
const paycheckRoutes = require('./routes/paycheckRoutes');

//connect to database 
connectDB();

//create express app
const app = express();

//middleware
app.use(cors());
app.use(express.json());

//routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes); 
app.use('/api/debts', debtRoutes);
app.use('/api/bill-shares', billShareRoutes);
app.use('/api/debt-transactions', debtTransactionRoutes);
app.use('/api/debt-payments', debtPaymentRoutes);
app.use('/api/savings-goals', savingsGoalRoutes); 
app.use('/api/contributions', contributionRoutes);
app.use('/api/paychecks', paycheckRoutes);

//test route 
app.get('/', (req, res) => {
  res.json({ message: 'BlackBills API is running' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`BlackBills server is running on port ${PORT}`);
});