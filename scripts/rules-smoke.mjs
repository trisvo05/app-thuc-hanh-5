import {readFileSync} from 'node:fs';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {get, increment, onDisconnect, push, ref, serverTimestamp, set, update} from 'firebase/database';

const rules = readFileSync(new URL('../firebase-database.rules.json', import.meta.url), 'utf8');
const env = await initializeTestEnvironment({projectId: 'demo-chat', database: {host: '127.0.0.1', port: 9000, rules}});
const suffix = Date.now().toString(36);
const uidA = `rulesA${suffix}`;
const uidB = `rulesB${suffix}`;
const outsider = `rulesX${suffix}`;
const id = [uidA, uidB].sort().join('_');
const a = env.authenticatedContext(uidA).database();
const b = env.authenticatedContext(uidB).database();
const x = env.authenticatedContext(outsider).database();

async function step(label, action) {
  try {await assertSucceeds(action()); console.log(`PASS ${label}`);}
  catch (error) {console.error(`FAIL ${label}`, error); throw error;}
}

try {
  await step('create user A', () => set(ref(a, `users/${uidA}`), {uid: uidA, fullName: 'A', email: 'a@example.test', createdAt: serverTimestamp()}));
  await step('create user B', () => set(ref(b, `users/${uidB}`), {uid: uidB, fullName: 'B', email: 'b@example.test', createdAt: serverTimestamp()}));
  await step('read contacts', () => get(ref(a, 'users')));
  await step('read own empty conversation list', () => get(ref(a, `userConversations/${uidA}`)));
  await step('create conversation', () => set(ref(a, `conversations/${id}`), {participants: {[uidA]: true, [uidB]: true}, createdAt: serverTimestamp()}));
  await step('create A membership', () => update(ref(a, `userConversations/${uidA}/${id}`), {peerId: uidB, updatedAt: serverTimestamp(), unreadCount: increment(0)}));
  await step('create B membership', () => update(ref(a, `userConversations/${uidB}/${id}`), {peerId: uidA, updatedAt: serverTimestamp(), unreadCount: increment(0)}));
  await step('write online presence', () => set(ref(a, `presence/${uidA}`), {online: true, lastSeen: serverTimestamp()}));
  await step('queue offline on disconnect', () => onDisconnect(ref(a, `presence/${uidA}`)).set({online: false, lastSeen: serverTimestamp()}));
  await step('read presence', () => get(ref(b, 'presence')));
  const message = push(ref(a, `messages/${id}`));
  await step('send message and increment receiver unread atomically', () => update(ref(a), {
    [`messages/${id}/${message.key}`]: {id: message.key, senderId: uidA, receiverId: uidB, type: 'text', text: 'hello', createdAt: serverTimestamp()},
    [`userConversations/${uidB}/${id}/unreadCount`]: increment(1),
    [`userConversations/${uidB}/${id}/updatedAt`]: serverTimestamp(),
    [`userConversations/${uidA}/${id}/updatedAt`]: serverTimestamp(),
  }));
  await step('receiver reads message', () => get(ref(b, `messages/${id}`)));
  const beforeRead = (await get(ref(b, `userConversations/${uidB}/${id}`))).val();
  if (beforeRead.unreadCount !== 1) {throw new Error(`Expected 1 unread, got ${beforeRead.unreadCount}`);}
  console.log('PASS receiver unread is 1');
  await step('receiver marks read', () => update(ref(b, `userConversations/${uidB}/${id}`), {lastReadMessageId: message.key, unreadCount: 0, updatedAt: serverTimestamp()}));
  const afterRead = (await get(ref(b, `userConversations/${uidB}/${id}`))).val();
  if (afterRead.unreadCount !== 0) {throw new Error(`Expected 0 unread, got ${afterRead.unreadCount}`);}
  console.log('PASS receiver unread resets to 0');
  const location = push(ref(b, `messages/${id}`));
  await step('reply with location and increment A unread', () => update(ref(b), {
    [`messages/${id}/${location.key}`]: {id: location.key, senderId: uidB, receiverId: uidA, type: 'location', latitude: 10.75, longitude: 106.67, createdAt: serverTimestamp()},
    [`userConversations/${uidA}/${id}/unreadCount`]: increment(1),
    [`userConversations/${uidA}/${id}/updatedAt`]: serverTimestamp(),
    [`userConversations/${uidB}/${id}/updatedAt`]: serverTimestamp(),
  }));
  await step('A reads location reply', () => get(ref(a, `messages/${id}`)));
  await assertFails(get(ref(x, `messages/${id}`)));
  console.log('PASS outsider cannot read messages');
} finally {
  await env.cleanup();
}
