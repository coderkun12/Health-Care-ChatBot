// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { fetchSessions, createSession } from '../services/api';

const Sidebar = ({ onSelectSession, activeSessionId }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const sessionsData = await fetchSessions();
    setSessions(sessionsData);
  };

  const handleCreateSession = async () => {
    const newSession = await createSession();
    if (newSession) {
      setSessions([newSession, ...sessions]);
      onSelectSession(newSession.session_id);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Previous Chats</h2>
        <button onClick={handleCreateSession} className="new-chat-btn">
          New Chat
        </button>
      </div>
      <div className="sessions-scroll">
        <div className="sessions-list">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              className={`session-item ${session.session_id === activeSessionId ? 'active' : ''}`}
              onClick={() => onSelectSession(session.session_id)}
            >
              <div className="session-title">Chat {session.session_id.substring(0, 8)}...</div>
              <div className="session-date">{session.last_updated}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
