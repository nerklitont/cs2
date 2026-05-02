import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const socket = io('/', { transports: ['websocket', 'polling'] });

export function SocketProvider({ children }) {
  const [online, setOnline] = useState(0);
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState({ total_upgrades: 0, total_wins: 0, total_losses: 0 });

  useEffect(() => {
    fetch('/api/upgrade/feed')
      .then(r => r.json())
      .then(setFeed)
      .catch(() => {});

    fetch('/api/upgrade/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});

    socket.on('online', setOnline);
    socket.on('upgrade', (data) => {
      setFeed(prev => [data, ...prev].slice(0, 20));
    });
    socket.on('stats', setStats);

    return () => {
      socket.off('online');
      socket.off('upgrade');
      socket.off('stats');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, online, feed, stats }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
