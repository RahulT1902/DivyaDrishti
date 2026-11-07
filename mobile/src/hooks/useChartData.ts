import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * The /api/astrology/chart payload (chart, temporal, timeline, transits,
 * domain intelligence). Every module screen reads from it, as the web
 * DashboardHub does, so it is cached and shared through the API cache layer.
 */
export function useChartData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      const res = force
        ? await api.getForce('/api/astrology/chart')
        : await api.getCached('/api/astrology/chart', undefined, { cacheTtl: 30 * 60 * 1000 });
      if (res?.success && res?.data) setData(res.data);
      else setError(res?.error?.message || 'Failed to load chart details.');
    } catch (err: any) {
      setError(err?.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: () => load(true) };
}
