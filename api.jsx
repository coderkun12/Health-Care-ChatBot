// src/services/api.jsx
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchSessions = async () => {
  try {
    const response = await axios.get(`${API_URL}/sessions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

export const createSession = async () => {
  try {
    const response = await axios.post(`${API_URL}/sessions`,{});
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

export const fetchMessages = async (sessionId) => {
  try {
    const response = await axios.get(`${API_URL}/sessions/${sessionId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (sessionId, message) => {
  try {
    const response = await axios.post(`${API_URL}/sessions/${sessionId}/messages`, {
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};