import {get, increment, limitToLast, onDisconnect, onValue, orderByKey, push, query, ref, serverTimestamp, set, update} from 'firebase/database';
import {database} from './firebase';
import {ChatMessage, conversationId} from '../domain/chat';
import {createNotification} from './notificationService';
export {conversationId, unreadCount} from '../domain/chat';
export type {ChatMessage};

export type ConversationLink = {id: string; peerId: string; updatedAt: number; unreadCount: number; lastReadMessageId?: string; lastMessage?: string; lastSenderId?: string};
function db() {if (!database) {throw new Error('Firebase chưa được cấu hình.');} return database;}

export async function ensureConversation(uid: string, peerId: string) {
  if (!uid || !peerId || uid === peerId) {throw new Error('Người nhận không hợp lệ.');}
  const id = conversationId(uid, peerId);
  const conversationRef = ref(db(), `conversations/${id}`);
  if (!(await get(ref(db(), `userConversations/${uid}/${id}`))).exists()) {
    try {await set(conversationRef, {type: 'direct', participants: {[uid]: true, [peerId]: true}, members: {[uid]: true, [peerId]: true}, createdBy: uid, createdAt: serverTimestamp()});}
    catch (error) {const existing = await get(conversationRef).catch(() => null); if (!existing?.exists()) {throw error;}}
  }
  await Promise.all([update(ref(db(), `userConversations/${uid}/${id}`), {peerId, updatedAt: serverTimestamp(), unreadCount: increment(0)}), update(ref(db(), `userConversations/${peerId}/${id}`), {peerId: uid, updatedAt: serverTimestamp(), unreadCount: increment(0)})]);
  return id;
}
export async function getConversationPeer(uid: string, id: string) {const snap = await get(ref(db(), `conversations/${id}`)); const conversation = snap.val(); const members = conversation?.members ?? conversation?.participants ?? {}; const peerId = Object.keys(members).find(member => member !== uid); if (!peerId) {throw new Error('Không tìm thấy thành viên cuộc trò chuyện.');} const user = await get(ref(db(), `users/${peerId}`)); if (!user.exists()) {throw new Error('Không tìm thấy hồ sơ thành viên.');} return user.val();}
export function subscribeConversationLinks(uid: string, onUpdate: (links: ConversationLink[]) => void, error: (error: Error) => void) {
  return onValue(ref(db(), `userConversations/${uid}`), snap => {const raw = snap.val() ?? {}; onUpdate(Object.entries(raw).map(([id, value]) => ({id, ...(value as Omit<ConversationLink, 'id'>)})));}, error);
}
export function subscribeMessages(id: string, onUpdate: (messages: ChatMessage[]) => void, error: (error: Error) => void) {
  return onValue(query(ref(db(), `messages/${id}`), orderByKey(), limitToLast(20)), snap => {const messages = Object.entries(snap.val() ?? {}).map(([key, value]) => ({...(value as ChatMessage), id: (value as ChatMessage).id ?? key})); messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.id.localeCompare(b.id)); onUpdate(messages);}, error);
}
export async function loadOlderMessages(id: string, beforeId: string, count = 20): Promise<ChatMessage[]> {
  const snap = await get(query(ref(db(), `messages/${id}`), orderByKey(), limitToLast(count + 1)));
  return Object.entries(snap.val() ?? {}).filter(([key]) => key < beforeId).slice(-count).map(([key, value]) => ({...(value as ChatMessage), id: (value as ChatMessage).id ?? key}));
}
export function markRead(uid: string, id: string, messageId: string) {
  return update(ref(db()), {[`userConversations/${uid}/${id}/lastReadMessageId`]: messageId, [`userConversations/${uid}/${id}/unreadCount`]: 0, [`userConversations/${uid}/${id}/updatedAt`]: serverTimestamp(), [`readStatus/${id}/${uid}`]: serverTimestamp()});
}
async function send(uid: string, id: string, type: string, content: Record<string, unknown>, textPreview: string) {
  const conv = (await get(ref(db(), `conversations/${id}`))).val();
  const members = conv?.members ?? conv?.participants ?? {};
  if (!members[uid]) {throw new Error('Bạn không thuộc cuộc trò chuyện này.');}
  const messageRef = push(ref(db(), `messages/${id}`)); if (!messageRef.key) {throw new Error('Không tạo được tin nhắn.');}
  const updates: Record<string, unknown> = {[`messages/${id}/${messageRef.key}`]: {id: messageRef.key, senderId: uid, type, ...content, createdAt: serverTimestamp(), recalled: false}};
  Object.keys(members).filter(member => member !== uid).forEach(member => {updates[`userConversations/${member}/${id}/unreadCount`] = increment(1); updates[`userConversations/${member}/${id}/updatedAt`] = serverTimestamp(); updates[`userConversations/${member}/${id}/lastMessage`] = textPreview; updates[`userConversations/${member}/${id}/lastSenderId`] = uid;});
  Object.keys(members).forEach(member => {updates[`userConversations/${member}/${id}/updatedAt`] = serverTimestamp(); updates[`userConversations/${member}/${id}/lastMessage`] = textPreview; updates[`userConversations/${member}/${id}/lastSenderId`] = uid;});
  await update(ref(db()), updates);
  await Promise.all(Object.keys(members).filter(member => member !== uid).map(member => createNotification(member, {type: 'message', convId: id, fromUid: uid, text: `Tin nhắn mới: ${textPreview}`})));
  return messageRef.key;
}
export async function sendText(uid: string, peerId: string, text: string) {const trimmed = text.trim(); if (!trimmed) {throw new Error('Tin nhắn không được để trống.');} if (trimmed.length > 10000) {throw new Error('Tin nhắn quá dài (tối đa 10.000 ký tự).');} const id = await ensureConversation(uid, peerId); await send(uid, id, 'text', {text: trimmed}, trimmed);}
export async function sendTextToConversation(uid: string, id: string, text: string) {const trimmed = text.trim(); if (!trimmed) {throw new Error('Tin nhắn không được để trống.');} await send(uid, id, 'text', {text: trimmed}, trimmed);}
export async function sendLocation(uid: string, peerId: string, latitude: number, longitude: number) {if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {throw new Error('Tọa độ không hợp lệ.');} const id = await ensureConversation(uid, peerId); await send(uid, id, 'location', {latitude, longitude}, '📍 Vị trí');}
export async function sendImage(uid: string, id: string, imageUrl: string) {await send(uid, id, 'image', {imageUrl}, '📷 Hình ảnh');}
export async function setReaction(uid: string, id: string, messageId: string, emoji: string) {const msg = (await get(ref(db(), `messages/${id}/${messageId}`))).val(); if (!msg || msg.senderId === uid) {return;} await set(ref(db(), `messages/${id}/${messageId}/reactions/${uid}`), emoji); await createNotification(msg.senderId, {type: 'reaction', convId: id, fromUid: uid, text: `Đã thả ${emoji} vào tin nhắn của bạn`});}
export async function recallMessage(uid: string, id: string, messageId: string) {const root = ref(db()); const snap = await get(ref(db(), `messages/${id}/${messageId}`)); if (snap.val()?.senderId !== uid) {throw new Error('Chỉ người gửi mới có thể thu hồi tin nhắn.');} const updates: Record<string, unknown> = {[`messages/${id}/${messageId}/recalled`]: true}; const conv = (await get(ref(db(), `conversations/${id}`))).val(); const members = conv?.members ?? conv?.participants ?? {}; const last = (await get(query(ref(db(), `messages/${id}`), orderByKey(), limitToLast(1)))).val(); if (last && Object.keys(last)[0] === messageId) {Object.keys(members).forEach(member => {updates[`userConversations/${member}/${id}/lastMessage`] = 'Tin nhắn đã được thu hồi';});} await update(root, updates);}
export function setTyping(id: string, uid: string, value: boolean) {const typingRef = ref(db(), `typing/${id}/${uid}`); if (value) {onDisconnect(typingRef).remove(); return set(typingRef, true);} return onDisconnect(typingRef).cancel().then(() => set(typingRef, null));}
export function subscribeTyping(id: string, callback: (typing: Record<string, boolean>) => void, error: (error: Error) => void) {return onValue(ref(db(), `typing/${id}`), snap => callback(snap.val() ?? {}), error);}
export function subscribeReadStatus(id: string, uid: string, callback: (time: number | null) => void, error: (error: Error) => void) {return onValue(ref(db(), `readStatus/${id}/${uid}`), snap => callback(snap.val()), error);}
