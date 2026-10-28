export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'location';
  text?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
};
export function conversationId(uid1: string, uid2: string) {return [uid1, uid2].sort().join('_');}
export function unreadCount(messages: ChatMessage[], uid: string, lastReadMessageId?: string) {
  const readIndex = lastReadMessageId ? messages.findIndex(message => message.id === lastReadMessageId) : -1;
  return messages.slice(readIndex + 1).filter(message => message.senderId !== uid).length;
}
