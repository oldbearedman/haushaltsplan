// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Real-time listener on the "users" collection
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      error => {
        console.error('useUsers error:', error);
      }
    );
    return unsubscribe;
  }, []);

  return users;
}
