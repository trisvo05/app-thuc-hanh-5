import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {friendlyError} from '../services/authService';
import {subscribePresence} from '../services/presenceService';
import {subscribeUsers, UserProfile} from '../services/userService';
import {Avatar} from '../ui/Avatar';
import {colors, common} from '../ui/theme';

export function ContactsScreen({uid, openChat}: {uid: string; openChat: (peer: UserProfile) => void}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const fail = (cause: Error) => {setError(friendlyError(cause)); setLoading(false);};
    const offUsers = subscribeUsers(value => {setUsers(value); setLoading(false); setError('');}, fail);
    const offPresence = subscribePresence(setOnline, fail);
    return () => {offUsers(); offPresence();};
  }, []);
  const filtered = useMemo(() => users.filter(user => user.uid !== uid && user.fullName?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => a.fullName.localeCompare(b.fullName)), [users, uid, search]);
  return <View style={common.screen}>
    <View style={common.content}><Text style={common.title}>Danh bạ</Text><Text style={common.subtitle}>Chọn một người để bắt đầu trò chuyện</Text><TextInput style={common.input} placeholder="Tìm theo tên" value={search} onChangeText={setSearch} /></View>
    {loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={common.error}>{error}</Text> : <FlatList data={filtered} keyExtractor={item => item.uid} ListEmptyComponent={<Text style={common.empty}>Không tìm thấy người dùng.</Text>} renderItem={({item}) => <TouchableOpacity style={common.row} onPress={() => openChat(item)}><Avatar name={item.fullName} uri={item.avatarUrl} online={online[item.uid] ?? false} /><View style={styles.details}><Text style={styles.name}>{item.fullName}</Text><Text style={styles.status}>{online[item.uid] ? 'Đang hoạt động' : 'Ngoại tuyến'}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>} />}
  </View>;
}
const styles = StyleSheet.create({details: {flex: 1, marginLeft: 14}, name: {fontSize: 16, fontWeight: '600', color: colors.text}, status: {color: colors.muted, marginTop: 4}, arrow: {fontSize: 24, color: colors.muted}});
