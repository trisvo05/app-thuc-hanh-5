import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AppNotification, markAllNotificationsRead, markNotificationRead, subscribeNotifications} from '../services/notificationService';
import {friendlyError} from '../services/authService';
import {colors, common} from '../ui/theme';

export function NotificationsScreen({uid, openConversation}: {uid: string; openConversation: (id: string) => void}) {
  const [items, setItems] = useState<AppNotification[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => {const off = subscribeNotifications(uid, value => {setItems(value); setLoading(false);}, cause => {setError(friendlyError(cause)); setLoading(false);}); return off;}, [uid]);
  const markAll = async () => {try {await markAllNotificationsRead(uid);} catch (cause) {setError(friendlyError(cause));}};
  const open = async (item: AppNotification) => {try {await markNotificationRead(uid, item.id); openConversation(item.convId);} catch (cause) {setError(friendlyError(cause));}};
  return <View style={common.screen}><View style={styles.heading}><View><Text style={common.title}>Thông báo</Text><Text style={common.subtitle}>Cập nhật của bạn</Text></View><TouchableOpacity onPress={markAll}><Text style={styles.action}>Đánh dấu tất cả đã đọc</Text></TouchableOpacity></View>{!!error && <Text style={common.error}>{error}</Text>}{loading ? <ActivityIndicator color={colors.primary} /> : <FlatList data={items} keyExtractor={item => item.id} ListEmptyComponent={<Text style={common.empty}>Chưa có thông báo.</Text>} renderItem={({item}) => <TouchableOpacity onPress={() => open(item)} style={[styles.row, !item.read && styles.unread]}><View style={styles.dot}>{!item.read && <View style={styles.dotInner} />}</View><View style={styles.copy}><Text style={styles.text}>{item.text}</Text><Text style={styles.time}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text></View></TouchableOpacity>} />}</View>;
}
const styles = StyleSheet.create({heading: {padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, action: {color: colors.primary, fontSize: 12, fontWeight: '600', maxWidth: 115, textAlign: 'right'}, row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border}, unread: {backgroundColor: '#f5f3ff'}, dot: {width: 16, alignItems: 'center'}, dotInner: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary}, copy: {flex: 1, marginLeft: 8}, text: {color: colors.text, fontSize: 15}, time: {color: colors.muted, marginTop: 5, fontSize: 12}});
