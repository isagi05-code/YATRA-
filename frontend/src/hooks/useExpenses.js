import { useState, useEffect, useCallback } from 'react';
import { agencyApi } from '../services/agencyApi';

export function useExpenses(initialCategory = '', initialStatus = '', initialSearch = '') {
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agencyApi.getExpenses(category, status, search);
      setExpenses(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [category, status, search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expenseData) => {
    const res = await agencyApi.createExpense(expenseData);
    await fetchExpenses();
    return res;
  };

  const updateExpenseStatus = async (id, newStatus, approvedBy) => {
    const res = await agencyApi.updateExpense(id, newStatus, approvedBy);
    await fetchExpenses();
    return res;
  };

  const removeExpense = async (id) => {
    const res = await agencyApi.deleteExpense(id);
    await fetchExpenses();
    return res;
  };

  return {
    expenses,
    loading,
    error,
    category,
    setCategory,
    status,
    setStatus,
    search,
    setSearch,
    refresh: fetchExpenses,
    addExpense,
    updateExpenseStatus,
    removeExpense,
  };
}
