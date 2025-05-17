// src/components/TaskList.jsx
import React, { useState, useRef, useEffect } from "react";
import { assigneeColors } from "../utils/assigneeColors";
import useUsers from "../hooks/useUsers";
import "./TaskList.css";

export default function TaskList({ tasks, onComplete, currentUserId }) {
  const users = useUsers();
  const today = new Date().toISOString().slice(0, 10);
  const [lastResetTime, setLastResetTime] = useState(null);
  const [version, setVersion] = useState(0); // trigger to re-render UI

  useEffect(() => {
    const stored = localStorage.getItem("lastResetTime");
    if (stored) setLastResetTime(parseInt(stored));
  }, []);

  const CATEGORY_ORDER = [
    "Küche", "Wohnzimmer", "Wäsche", "Badezimmer",
    "Schlafzimmer", "Kinderzimmer", "Büro", "Flur",
    "Saugen", "Wischen", "Sonstiges"
  ];

  const [openCats, setOpenCats] = useState({});
  const catRefs = useRef({});

  const toggleCat = cat =>
    setOpenCats(prev => {
      const nxt = { ...prev, [cat]: !prev[cat] };
      if (!prev[cat] && catRefs.current[cat]) {
        setTimeout(() => {
          catRefs.current[cat].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
      return nxt;
    });

  // group tasks by category
  const grouped = tasks.reduce((acc, task) => {
    const cat = CATEGORY_ORDER.includes(task.category) ? task.category : "Küche";
    acc[cat] = acc[cat] || [];
    acc[cat].push(task);
    return acc;
  }, {});

  // split into available, locked, done for current user
  const splitByStatus = list => {
    const available = [], locked = [], done = [];
    list.forEach(task => {
      const assignedTo = task.assignedTo || [];
      const completions = Array.isArray(task.completions) ? task.completions : [];
      const isMulti = !!task.targetCount;

const isLocked =
  (task.availableFrom && new Date(task.availableFrom) > new Date()) ||
  (!assignedTo.includes('all') && !assignedTo.includes(currentUserId));


      // check done today by this user
      const doneMulti = isMulti && completions.filter(
        c => c.userId === currentUserId && c.date === today
      ).length >= task.targetCount;
      const doneSingle = !isMulti && task.doneById === currentUserId && task.lastDoneAt === today;

      if (doneSingle || doneMulti) {
        done.push(task);
      } else if (isLocked) {
        locked.push(task);
      } else {
        available.push(task);
      }
    });
    return { available, locked, done };
  };

  const renderAssignee = assignedTo => {
    const shown = assignedTo.includes('all')
      ? users
      : users.filter(u => assignedTo.includes(u.id));
    return (
      <div className="assignees-stack">
        {shown.map((u,i) => (
          <img
            key={u.id}
            src={`/profiles/${u.name.toLowerCase()}.jpg`}
            alt={u.name}
            className="assignee-avatar small"
            style={{ borderColor: assigneeColors[u.id], zIndex: shown.length - i }}
          />
        ))}
      </div>
    );
  };

  const renderTaskCard = (task, status) => {
    const assignedTo = task.assignedTo || [];
    const completions = Array.isArray(task.completions) ? task.completions : [];
    const isMulti = !!task.targetCount;
const doneCount = isMulti
  ? completions.filter(c => c.date === today).length
  : 0;


    const isDone = status === 'done';
    const isDisabled = status !== 'available';
    const color = assignedTo.includes(currentUserId)
      ? assigneeColors[currentUserId]
      : 'transparent';

    const icon = isDone ? '✖' : isDisabled ? <span>🔒</span> : `🪙 +${task.points}`;
const label = isDone
  ? 'Heute erledigt'
  : isDisabled && task.availableFrom
    ? `Verfügbar ab ${new Date(task.availableFrom).toLocaleDateString('de-DE')}`
    : isMulti
      ? `Noch ${task.targetCount - doneCount} von ${task.targetCount} heute`
      : 'Heute zu erledigen';


    return (
      <div
        key={`${task.id}-${status}-${version}`}
        className={`task-card ${isDone? 'done':''} ${isDisabled && !isDone? 'disabled':''}`}
        style={{ borderColor: color }}
      >
        <div className="task-assignee-top">
          {renderAssignee(assignedTo)}
        </div>
        {isMulti && (
          <div className="dot-progress">
            {Array.from({length: task.targetCount}).map((_,i) => (
              <span key={i} className={i < doneCount? 'dot done':'dot'} />
            ))}
          </div>
        )}
        <div className="task-content">
          <div className="task-title">{task.name}</div>
          <button
            className={`done-button${isDone||isDisabled? ' grey':''}`}
            onClick={() => { onComplete(task); setVersion(v=>v+1); }}
            disabled={isDisabled}
          >{icon}</button>
        </div>
        <div className="task-label-top">{label}</div>
      </div>
    );
  };

  return (
    <div className="task-list" key={version}>
      {CATEGORY_ORDER.map(cat => {
        const list = grouped[cat] || [];
        const { available, locked, done } = splitByStatus(list);
        const isOpen = !!openCats[cat];
        return (
          <div key={cat} className="task-category" ref={el=>catRefs.current[cat]=el}>
            <div className="category-header" onClick={()=>toggleCat(cat)}>
              <span>{cat}</span>
              <span className="chevron">{isOpen?'▼':'▶'}</span>
            </div>
            {isOpen && (
              <>
                {available.map(t=>renderTaskCard(t,'available'))}
                {locked.map(t=>renderTaskCard(t,'locked'))}
                {done.map(t=>renderTaskCard(t,'done'))}
              </>
            )}
          </div>
        );
      })}
      {lastResetTime && (
        <div style={{textAlign:'center', fontSize:'0.75rem', marginTop:24, color:'#888'}}>
          Letzter automatischer Reset: {new Date(lastResetTime).toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit'})} um {new Date(lastResetTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}
        </div>
      )}
    </div>
  );
}
