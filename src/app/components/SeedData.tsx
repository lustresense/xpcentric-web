import { useEffect, useState } from 'react';
import { apiPublicGet } from '@/lib/api';

export function useSeedData() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const pingHealth = async () => {
      try {
        await apiPublicGet('/health');
      } catch {
        // Local API may not be running yet.
      } finally {
        // Seeding is handled by local_api.py (SQLite), not frontend.
        setSeeded(true);
      }
    };

    pingHealth();
  }, []);

  return seeded;
}
