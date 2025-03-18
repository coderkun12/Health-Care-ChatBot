import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

const ChatBox = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-box-container">
      <div className="chat-box">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation with the German ChatBot!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBox;