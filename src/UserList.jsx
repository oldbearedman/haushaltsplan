// src/UserList.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const UserList = ({ onUserSelect }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  return (
    <div className="name-select">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onUserSelect(user)}
        >
          {user.name}
        </button>
      ))}
    </div>
  );
};

export default UserList;
