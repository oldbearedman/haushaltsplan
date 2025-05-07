// src/components/AdminPanel.jsx
import React, { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPanel({ users, onReset, onCloseAdmin, isRewardsMode, setRewardsMode }) {
  // State für Task-Form
  const [taskName, setTaskName] = useState('');
  const [taskPoints, setTaskPoints] = useState(1);
  const [taskPerDay, setTaskPerDay] = useState(1);
  const [taskInterval, setTaskInterval] = useState(1);
  const [taskAssignee, setTaskAssignee] = useState('all');

  // State für Reward-Form
  const [rewardName, setRewardName] = useState('');
  const [rewardCost, setRewardCost] = useState(1);

  const addTask = async e => {
    e.preventDefault();
    await addDoc(collection(db, 'tasks'), {
      name: taskName,
      points: taskPoints,
      targetCount: taskPerDay,
      assignedTo: taskAssignee === 'all' ? ['all'] : [taskAssignee],
      repeatInterval: taskInterval,
      doneBy: '',
      lastDoneAt: '',
      availableFrom: '',
    });
    setTaskName('');
  };

  const addReward = async e => {
    e.preventDefault();
    await addDoc(collection(db, 'rewards'), {
      name: rewardName,
      cost: rewardCost,
    });
    setRewardName('');
  };

  const clearAllTasks = async () => {
    if (!window.confirm('Alle Tasks löschen?')) return;
    const snap = await getDocs(collection(db, 'tasks'));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'tasks', d.id))));
    alert('Alle Tasks gelöscht');
  };

  const clearAllRewards = async () => {
    if (!window.confirm('Alle Prämien löschen?')) return;
    const snap = await getDocs(collection(db, 'rewards'));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'rewards', d.id))));
    alert('Alle Prämien gelöscht');
  };

  return (
    <div className="admin-panel">
      <h2>🔧 Admin-Bereich {isRewardsMode ? '– Prämien' : '– Aufgaben'}</h2>
      <div className="admin-controls">
        <button className="admin-btn reset" onClick={onReset}>
          🔄 App zurücksetzen
        </button>
        <button
          className="admin-btn delete"
          onClick={isRewardsMode ? clearAllRewards : clearAllTasks}
        >
          🗑️ {isRewardsMode ? 'Alle Prämien löschen' : 'Alle Tasks löschen'}
        </button>
        <button
          className="admin-btn"
          onClick={() => setRewardsMode(!isRewardsMode)}
        >
          {isRewardsMode ? '📝 Aufgaben bearbeiten' : '🏆 Prämien bearbeiten'}
        </button>
        <button className="admin-close" onClick={onCloseAdmin}>✕</button>
      </div>

      {isRewardsMode ? (
        <form onSubmit={addReward} className="admin-form">
          <h3>Neue Prämie hinzufügen</h3>
          <label>
            Prämienname
            <input
              type="text"
              value={rewardName}
              onChange={e => setRewardName(e.target.value)}
              placeholder="z.B. Kinoabend"
              required
            />
          </label>
          <label>
            Kosten (Punkte)
            <input
              type="number"
              min="1"
              value={rewardCost}
              onChange={e => setRewardCost(+e.target.value)}
            />
          </label>
          <button type="submit" className="admin-btn add">
            ➕ Prämie hinzufügen
          </button>
        </form>
      ) : (
        <form onSubmit={addTask} className="admin-form">
          <h3>Neue Aufgabe anlegen</h3>
          <label>
            Aufgabenname
            <input
              type="text"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="z.B. Küche aufräumen"
              required
            />
          </label>
          <label>
            Punktewert
            <input
              type="number"
              min="1"
              value={taskPoints}
              onChange={e => setTaskPoints(+e.target.value)}
            />
          </label>
          <label>
            Wiederholungen pro Tag
            <input
              type="number"
              min="1"
              value={taskPerDay}
              onChange={e => setTaskPerDay(+e.target.value)}
            />
          </label>
          <label>
            Intervall in Tagen
            <input
              type="number"
              min="1"
              value={taskInterval}
              onChange={e => setTaskInterval(+e.target.value)}
            />
          </label>
          <label>
            Zugewiesen an
            <select
              value={taskAssignee}
              onChange={e => setTaskAssignee(e.target.value)}
            >
              <option value="all">Alle Nutzer</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="admin-btn add">
            ➕ Aufgabe hinzufügen
          </button>
        </form>
      )}
    </div>
  );
}
