import { useState, useEffect, useCallback } from 'react';
import { agencyApi } from '../services/agencyApi';

export function useTours(initialStatus = null) {
  const [tours, setTours] = useState([]);
  const [status, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agencyApi.getTours(status);
      setTours(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tours');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const createTour = async (tourData) => {
    const res = await agencyApi.createTour(tourData);
    await fetchTours();
    return res;
  };

  const updateTour = async (id, tourStatus, timelineStatus) => {
    const res = await agencyApi.updateTour(id, tourStatus, timelineStatus);
    await fetchTours();
    return res;
  };

  const deleteTour = async (id) => {
    const res = await agencyApi.deleteTour(id);
    await fetchTours();
    return res;
  };

  return {
    tours,
    loading,
    error,
    status,
    setStatusFilter,
    refresh: fetchTours,
    createTour,
    updateTour,
    deleteTour,
  };
}
