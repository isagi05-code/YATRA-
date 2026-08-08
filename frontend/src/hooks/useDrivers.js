import { useState, useEffect, useCallback } from 'react';
import { agencyApi } from '../services/agencyApi';

export function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agencyApi.getDrivers();
      setDrivers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const addDriver = async (driverData) => {
    const res = await agencyApi.createDriver(driverData);
    await fetchDrivers();
    return res;
  };

  const removeDriver = async (id) => {
    const res = await agencyApi.deleteDriver(id);
    await fetchDrivers();
    return res;
  };

  return { drivers, loading, error, refresh: fetchDrivers, addDriver, removeDriver };
}
