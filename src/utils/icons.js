import {
    FaBroom,
    FaUtensils,
    FaTshirt,
    FaToilet,
    FaHandsWash
  } from "react-icons/fa";
  
  export function getIcon(name) {
    const l = name.toLowerCase();
    if (l.includes("tisch"))     return <FaUtensils />;
    if (l.includes("wäsche"))    return <FaTshirt />;
    if (l.includes("boden"))     return <FaBroom />;
    if (l.includes("toilette") || l.includes("bad")) return <FaToilet />;
    if (l.includes("hände"))     return <FaHandsWash />;
    return <FaBroom />;
  }
  