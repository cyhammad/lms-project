'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/user-storage';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load users from localStorage
    const loadUsers = () => {
      setLoading(true);
      const data = getUsers();
      setUsers(data);
      setLoading(false);
    };

    loadUsers();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_users') {
        loadUsers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser = addUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUserById = (id: string, updates: Partial<User>) => {
    const updated = updateUser(id, updates);
    if (updated) {
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    }
    return updated;
  };

  const removeUser = (id: string) => {
    const success = deleteUser(id);
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
    return success;
  };

  return {
    users,
    loading,
    createUser,
    updateUser: updateUserById,
    deleteUser: removeUser,
    refresh: () => {
      setUsers(getUsers());
    },
  };
}
