import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ConversationLink, ChatMessage, subscribeConversationLinks, subscribeMessages, unreadCount} from '../services/chatService';
import {friendlyError} from '../services/authService';
import {subscribeUsers, UserProfile} from '../services/userService';
import {Avatar} from '../ui/Avatar';
import {colors, common} from '../ui/theme';

function time(value?: number) {return value ? new Date(value).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) : '';}
export function HomeScreen({uid, openChat}: {uid: string; openChat: (peer: UserProfile) => void}) {
  const [links, setLinks] = useState<ConversationLink[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const linkIds = useMemo(() => links.map(link => link.id).sort().join('|'), [links]);
  useEffect(() => {
    const fail = (cause: Error) => {setError(friendlyError(cause)); setLoading(false);};
    const offLinks = subscribeConversationLinks(uid, value => {setLinks(value); setLoading(false); setError('');}, fail);
    const offUsers = subscribeUsers(value => setUsers(Object.fromEntries(value.map(user => [user.uid, user]))), fail);
    return () => {offLinks(); offUsers();};
  }, [uid]);
  useEffect(() => {
    const off = linkIds.split('|').filter(Boolean).map(id => subscribeMessages(id, value => setMessages(current => ({...current, [id]: value})), cause => setError(friendlyError(cause))));
    return () => off.forEach(unsubscribe => unsubscribe());
  }, [linkIds]);
  const rows = useMemo(() => links.map(link => {
    const items = messages[link.id] ?? [];
    return {link, peer: users[link.peerId], last: items[items.length - 1], unread: unreadCount(items, uid, link.lastReadMessageId)};
  }).filter(row => row.peer).sort((a, b) => (b.last?.createdAt ?? 0) - (a.last?.createdAt ?? 0)), [links, messages, uid, users]);
  return <View style={common.screen}>
    <View style={common.content}><Text style={common.title}>Tin nhắn</Text><Text style={common.subtitle}>Các cuộc trò chuyện của bạn</Text></View>
    {loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={common.error}>{error}</Text> : <FlatList data={rows} keyExtractor={row => row.link.id} ListEmptyComponent={<Text style={common.empty}>Chưa có cuộc trò chuyện. Mở Danh bạ để bắt đầu.</Text>} renderItem={({item}) => <TouchableOpacity style={common.row} onPress={() => openChat(item.peer)}><Avatar name={item.peer.fullName} uri={item.peer.avatarUrl} /><View style={styles.details}><Text style={styles.name}>{item.peer.fullName}</Text><Text style={styles.preview} numberOfLines={1}>{item.last ? item.last.type === 'location' ? '📍 Vị trí' : item.last.text : 'Bắt đầu trò chuyện'}</Text></View><View style={styles.trailing}><Text style={styles.time}>{time(item.last?.createdAt)}</Text>{item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}</View></TouchableOpacity>} />}
  </View>;
}
const styles = StyleSheet.create({details: {flex: 1, marginLeft: 14}, name: {fontSize: 16, fontWeight: '600', color: colors.text}, preview: {color: colors.muted, marginTop: 5}, trailing: {alignItems: 'flex-end', marginLeft: 10}, time: {fontSize: 12, color: colors.muted}, badge: {marginTop: 6, backgroundColor: colors.primary, borderRadius: 12, minWidth: 22, paddingHorizontal: 5, paddingVertical: 2, alignItems: 'center'}, badgeText: {color: colors.white, fontSize: 12, fontWeight: '700'}});
