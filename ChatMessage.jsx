// src/components/ChatMessage.jsx
import React from 'react';

const ChatMessage = ({ message }) => {
  const isUser = message.sender === 'user';
  const messageText=message.content || message.messages;
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
      <div className="message-bubble">
        {messageText}
      </div>
      <div className="message-info">
        <span className="sender">{isUser ? 'You' : 'Bot'}</span>
        <span className="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default ChatMessage;