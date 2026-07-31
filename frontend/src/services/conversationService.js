import api from "./api";

export async function fetchConversations() {
  const { data } = await api.get("/conversations");
  return data; // returns array of conversations with unreadCount
}

export async function createConversation(recipientId) {
  const { data } = await api.post("/conversations", { recipientId });
  return data; // returns conversation object
}

export async function fetchConversationMessages(conversationId, page = 1) {
  const { data } = await api.get(`/conversations/${conversationId}/messages`, {
    params: { page, limit: 50 },
  });
  return data; // returns array of messages
}
