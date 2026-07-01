import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export let getNextPayDate = (userId) => api.get(`/paychecks/next-pay-date/${userId}`);
export let getRecentPayDate = (userId) => api.get(`/paychecks/recent-pay-date/${userId}`);
export let getSpendingByCategory = (owner, start, end) => api.get(`/dashboard?owner=${owner}&start=${start}&end=${end}`);
export let getAllBills = (householdId) => api.get(`/bills?householdId=${householdId}`);
export let getAllDebts = (householdId) => api.get(`/debts?householdId=${householdId}`);
export let getDebtBalance = (debtId) => api.get(`/debts/${debtId}/balance`);
export let getAllSavingsGoals = (householdId) => api.get(`/savings-goals?householdId=${householdId}`);
export let getSavingsGoalAmount = (goalId) => api.get(`/savings-goals/${goalId}/amount`);
export let deleteDebt = (debtId) => api.delete(`/debts/${debtId}`);
export let deleteSavingsGoal = (goalId) => api.delete(`/savings-goals/${goalId}`);
export let getDebtTransactions = (debtId) => api.get(`/debt-transactions?debt=${debtId}`);
export let createDebtTransaction = (data) => api.post('/debt-transactions', data);
export let getHouseholdMembers = (householdId) => api.get(`/auth/household-members?householdId=${householdId}`);
export let getContributions = (goalId) => api.get(`/contributions?savingsGoal=${goalId}`);
export let createContribution = (data) => api.post('/contributions', data);
export let getSharedBills = (householdId) => api.get(`/bills?householdId=${householdId}&isShared=true`);
export let getBillShares = (billId) => api.get(`/bill-shares?bill=${billId}`);
export let markBillSharePaid = (shareId, data) => api.put(`/bill-shares/${shareId}`, data);
export let createBill = (data) => api.post('/bills', data);
export let deleteBill = (billId) => api.delete(`/bills/${billId}`);
export let getPaychecks = (userId) => api.get(`/paychecks?earnedBy=${userId}`);
export let createPaycheck = (data) => api.post('/paychecks', data);
export let calculateLeftover = (paycheckId) => api.put(`/paychecks/${paycheckId}/leftover`);
export let createDebt = (data) => api.post('/debts', data);
export let createSavingsGoal = (data) => api.post('/savings-goals', data);
export let updatePayAnchorDate = (payAnchorDate) =>
  api.put('/auth/pay-anchor', { payAnchorDate });