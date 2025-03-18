// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';
import { fetchMessages, sendMessage, createSession } from './services/api';
import './styles.css';

function App() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Create a new session if none exists
    const initializeApp = async () => {
      if (!activeSessionId) {
        const newSession = await createSession();
        if (newSession) {
          setActiveSessionId(newSession.session_id);
        }
      }
    };
    
    initializeApp();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const loadMessages = async (sessionId) => {
    setLoading(true);
    const messagesData = await fetchMessages(sessionId);
    setMessages(messagesData);
    setLoading(false);
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const handleSendMessage = async (messageText) => {
    // Optimistically add user message to UI
    const userMessage = {
      sender: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setLoading(true);
    
    // Send to backend
    const response = await sendMessage(activeSessionId, messageText);
    
    if (response) {
      // Add bot response to UI
      const botMessage = {
        sender: 'bot',
        content: response.bot_response,
        timestamp: new Date().toISOString()
      };
      
      setMessages([...messages, userMessage, botMessage]);
    }
    
    setLoading(false);
  };

  return (
    <div className="app">
      <Sidebar 
        onSelectSession={handleSelectSession} 
        activeSessionId={activeSessionId} 
      />
      <div className="main-content">
        <Header />
        <div className="chat-container">
          <ChatBox messages={messages} />
          <MessageInput 
            onSendMessage={handleSendMessage} 
            disabled={loading || !activeSessionId} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;