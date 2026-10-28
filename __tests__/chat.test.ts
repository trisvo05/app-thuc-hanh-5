import {conversationId, unreadCount, ChatMessage} from '../src/domain/chat';

const message = (id: string, senderId: string): ChatMessage => ({id, senderId, receiverId: senderId === 'a' ? 'b' : 'a', type: 'text', text: id, createdAt: 1});
test('both users resolve to the same conversation', () => {
  expect(conversationId('b', 'a')).toBe('a_b');
  expect(conversationId('a', 'b')).toBe('a_b');
});
test('unread is derived from the read cursor and excludes own messages', () => {
  const items = [message('1', 'b'), message('2', 'a'), message('3', 'b')];
  expect(unreadCount(items, 'a')).toBe(2);
  expect(unreadCount(items, 'a', '1')).toBe(1);
  expect(unreadCount(items, 'a', '3')).toBe(0);
  expect(unreadCount(items, 'a', '1')).toBe(1);
});
