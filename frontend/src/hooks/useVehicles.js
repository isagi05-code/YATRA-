import { useState, useEffect, useCallback } from 'react';
import { agencyApi } from '../services/agencyApi';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agencyApi.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = async (vehicleData) => {
    const res = await agencyApi.createVehicle(vehicleData);
    await fetchVehicles();
    return res;
  };

  const updateVehicle = async (num, avail, loc) => {
    const res = await agencyApi.updateVehicle(num, avail, loc);
    await fetchVehicles();
    return res;
  };

  const removeVehicle = async (num) => {
    const res = await agencyApi.deleteVehicle(num);
    await fetchVehicles();
    return res;
  };

  return { vehicles, loading, error, refresh: fetchVehicles, addVehicle, updateVehicle, removeVehicle };
}
