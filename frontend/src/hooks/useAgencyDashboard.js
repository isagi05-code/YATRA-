import { useState, useEffect, useCallback } from 'react';
import { agencyApi } from '../services/agencyApi';

export function useAgencyDashboard() {
  const [summary, setSummary] = useState(null);
  const [graphs, setGraphs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, graphData] = await Promise.all([
        agencyApi.getSummary(),
        agencyApi.getGraphs(),
      ]);
      setSummary(sumData);
      setGraphs(graphData);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, graphs, loading, error, refresh: fetchData };
}
