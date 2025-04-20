import api from './api';

const messagingService = {
  // Get all contacts the current user can message
  getContacts: async () => {
    const response = await api.get('/messaging/contacts');
    return response.data;
  },

  // Get conversation with a specific user
  getConversation: async (userId: number) => {
    const response = await api.get(`/messaging/conversations/${userId}`);
    return response.data;
  },

  // Send a message to another user
  sendMessage: async (receiverId: number, content: string) => {
    const response = await api.post('/messaging/messages', {
      receiverId,
      content
    });
    return response.data;
  },

  // Mark a message as read
  markAsRead: async (messageId: number) => {
    const response = await api.put(`/messaging/messages/${messageId}/read`);
    return response.data;
  },

  // Get count of unread messages
  getUnreadCount: async () => {
    const response = await api.get('/messaging/messages/unread/count');
    return response.data.count;
  }
};

export default messagingService;