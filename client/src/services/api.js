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