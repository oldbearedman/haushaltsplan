// src/UserList.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { assigneeColors } from "./utils/assigneeColors";
import "./UserList.css";

const UserList = ({ onUserSelect }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  return (
    <div className="name-select">
      {users.map(user => {
        const glow = assigneeColors[user.id] || "#FFFFFF";
        return (
          <button
            key={user.id}
            className="profile-button"
            onClick={() => onUserSelect(user)}
          >
            <div
              className="glow-wrapper"
              style={{ "--glow-color": glow }}
            >
              <img
                src={`/profiles/${user.name.toLowerCase().replace(/\s+/g, "")}.jpg`}
                alt={user.name}
                className="profile-image"
              />
            </div>
            <div className="profile-name">{user.name}</div>
          </button>
        );
      })}
    </div>
  );
};

export default UserList;
