import {get, increment, onValue, push, ref, serverTimestamp, set, update} from 'firebase/database';
import {database} from './firebase';
import {ChatMessage, conversationId} from '../domain/chat';
export {conversationId, unreadCount} from '../domain/chat';
export type {ChatMessage};

export type ConversationLink = {id: string; peerId: string; updatedAt: number; unreadCount: number; lastReadMessageId?: string};
function db() {if (!database) {throw new Error('Firebase chưa được cấu hình.');} return database;}

export async function ensureConversation(uid: string, peerId: string) {
  if (!uid || !peerId || uid === peerId) {throw new Error('Người nhận không hợp lệ.');}
  const id = conversationId(uid, peerId);
  const conversationRef = ref(db(), `conversations/${id}`);
  // Rules chỉ cho đọc conversation đã tồn tại khi UID là participant.
  // Kiểm tra link của chính mình trước để tránh đọc conversation chưa tồn tại.
  if (!(await get(ref(db(), `userConversations/${uid}/${id}`))).exists()) {
    try {await set(conversationRef, {participants: {[uid]: true, [peerId]: true}, createdAt: serverTimestamp()});}
    catch (error) {
      const existing = await get(conversationRef).catch(() => null);
      if (!existing?.exists()) {throw error;}
    }
  }
  await Promise.all([
    update(ref(db(), `userConversations/${uid}/${id}`), {peerId, updatedAt: serverTimestamp(), unreadCount: increment(0)}),
    update(ref(db(), `userConversations/${peerId}/${id}`), {peerId: uid, updatedAt: serverTimestamp(), unreadCount: increment(0)}),
  ]);
  return id;
}

export function subscribeConversationLinks(uid: string, onUpdate: (links: ConversationLink[]) => void, error: (error: Error) => void) {
  return onValue(ref(db(), `userConversations/${uid}`), snap => {
    const raw = snap.val() ?? {};
    onUpdate(Object.entries(raw).map(([id, value]) => ({id, ...(value as Omit<ConversationLink, 'id'>)})));
  }, error);
}
export function subscribeMessages(id: string, onUpdate: (messages: ChatMessage[]) => void, error: (error: Error) => void) {
  return onValue(ref(db(), `messages/${id}`), snap => {
    const messages = Object.values(snap.val() ?? {}) as ChatMessage[];
    messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.id.localeCompare(b.id));
    onUpdate(messages);
  }, error);
}
export function markRead(uid: string, id: string, messageId: string) {
  return update(ref(db(), `userConversations/${uid}/${id}`), {lastReadMessageId: messageId, unreadCount: 0, updatedAt: serverTimestamp()});
}
export async function sendText(uid: string, peerId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {throw new Error('Tin nhắn không được để trống.');}
  if (trimmed.length > 10000) {throw new Error('Tin nhắn quá dài (tối đa 10.000 ký tự).');}
  const id = await ensureConversation(uid, peerId);
  const messageRef = push(ref(db(), `messages/${id}`));
  if (!messageRef.key) {throw new Error('Không tạo được tin nhắn.');}
  await update(ref(db()), {
    [`messages/${id}/${messageRef.key}`]: {id: messageRef.key, senderId: uid, receiverId: peerId, type: 'text', text: trimmed, createdAt: serverTimestamp()},
    [`userConversations/${peerId}/${id}/unreadCount`]: increment(1),
    [`userConversations/${peerId}/${id}/updatedAt`]: serverTimestamp(),
    [`userConversations/${uid}/${id}/updatedAt`]: serverTimestamp(),
  });
}
export async function sendLocation(uid: string, peerId: string, latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {throw new Error('Tọa độ không hợp lệ.');}
  const id = await ensureConversation(uid, peerId);
  const messageRef = push(ref(db(), `messages/${id}`));
  if (!messageRef.key) {throw new Error('Không tạo được tin nhắn.');}
  await update(ref(db()), {
    [`messages/${id}/${messageRef.key}`]: {id: messageRef.key, senderId: uid, receiverId: peerId, type: 'location', latitude, longitude, createdAt: serverTimestamp()},
    [`userConversations/${peerId}/${id}/unreadCount`]: increment(1),
    [`userConversations/${peerId}/${id}/updatedAt`]: serverTimestamp(),
    [`userConversations/${uid}/${id}/updatedAt`]: serverTimestamp(),
  });
}
