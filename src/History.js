import React, { useState, useEffect } from "react";
import axios from "axios";

const History = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/history");
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <h1>AI Response History</h1>
      {history.length === 0 ? (
        <p>No history available.</p>
      ) : (
        <ul>
          {history.map((entry, index) => (
            <li key={index}>
              <h3>Timestamp: {new Date(entry.timestamp).toLocaleString()}</h3>
              <p>Prompt: {entry.prompt}</p>
              <p>Response: {entry.response}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
