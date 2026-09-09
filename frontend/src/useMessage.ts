import { useState, useEffect } from 'react';

interface MessageResponse {
  message: string;
  status: string;
  mongoConnected: boolean;
  collectionsCount?: number;
}

export function useMessage() {
  const [data, setData] = useState<MessageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/message')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data from API:', err);
        setError(err.message || 'Error de conexión con el servidor');
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
