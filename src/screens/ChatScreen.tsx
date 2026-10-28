import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, PermissionsAndroid, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParams} from '../navigation/RootNavigation';
import {friendlyError} from '../services/authService';
import {ChatMessage, ensureConversation, markRead, sendLocation, sendText, subscribeMessages} from '../services/chatService';
import {subscribePresence} from '../services/presenceService';
import {subscribeUser, UserProfile} from '../services/userService';
import {Avatar} from '../ui/Avatar';
import {colors, common} from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParams, 'Chat'> & {uid: string};
function formatTime(value?: number) {return value ? new Date(value).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) : '...';}
export function ChatScreen({route, navigation, uid}: Props) {
  const [peer, setPeer] = useState<UserProfile>(route.params.peer);
  const [online, setOnline] = useState(false);
  const [id, setId] = useState('');
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);
  const readId = useRef('');
  const peerId = route.params.peer.uid;
  useEffect(() => {
    let active = true;
    ensureConversation(uid, peerId).then(value => {if (active) {setId(value);}}).catch(cause => {if (active) {setError(friendlyError(cause)); setLoading(false);}});
    const offUser = subscribeUser(peerId, value => {if (value) {setPeer(value);}}, cause => setError(friendlyError(cause)));
    const offPresence = subscribePresence(value => setOnline(value[peerId] ?? false), cause => setError(friendlyError(cause)));
    return () => {active = false; offUser(); offPresence();};
  }, [uid, peerId]);
  useEffect(() => {
    if (!id) {return;}
    return subscribeMessages(id, value => {
      setItems(value); setLoading(false); setError('');
      const last = value[value.length - 1];
      if (last && last.id !== readId.current) {
        readId.current = last.id;
        markRead(uid, id, last.id).catch(cause => setError(friendlyError(cause)));
      }
    }, cause => {setError(friendlyError(cause)); setLoading(false);});
  }, [id, uid]);
  const send = async () => {
    if (!text.trim() || busy) {return;}
    const draft = text;
    setBusy(true); setError('');
    try {await sendText(uid, peerId, draft); setText(current => current === draft ? '' : current);}
    catch (cause) {setError(friendlyError(cause));}
    finally {setBusy(false);}
  };
  const shareLocation = async () => {
    if (busy) {return;}
    setBusy(true); setError('');
    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {throw new Error('Bạn chưa cho phép truy cập vị trí.');}
      }
      const coords = await new Promise<{latitude: number; longitude: number}>((resolve, reject) => {
        Geolocation.getCurrentPosition(position => resolve(position.coords), positionError => reject(new Error(positionError.code === 3 ? 'Lấy vị trí quá thời gian. Hãy thử lại.' : 'Không lấy được vị trí GPS. Kiểm tra dịch vụ vị trí và thử lại.')), {enableHighAccuracy: true, timeout: 15000, maximumAge: 0});
      });
      await sendLocation(uid, peerId, coords.latitude, coords.longitude);
    } catch (cause) {setError(friendlyError(cause));}
    finally {setBusy(false);}
  };
  const openMap = async (message: ChatMessage) => {
    if (message.latitude === undefined || message.longitude === undefined) {return;}
    const url = `https://www.google.com/maps/search/?api=1&query=${message.latitude},${message.longitude}`;
    try {await Linking.openURL(url);} catch {Alert.alert('Không thể mở Google Maps', 'Hãy kiểm tra trình duyệt hoặc ứng dụng Maps.');}
  };
  return <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity><Avatar name={peer.fullName} uri={peer.avatarUrl} online={online} size={42} /><View style={styles.headerDetails}><Text style={styles.headerName}>{peer.fullName}</Text><Text style={styles.headerStatus}>{online ? 'Đang hoạt động' : 'Ngoại tuyến'}</Text></View></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View> : <FlatList ref={list} data={items} keyExtractor={item => item.id} contentContainerStyle={styles.messages} onContentSizeChange={() => list.current?.scrollToEnd({animated: true})} ListEmptyComponent={<Text style={common.empty}>Chưa có tin nhắn. Hãy gửi lời chào!</Text>} renderItem={({item}) => {
      const mine = item.senderId === uid;
      return <TouchableOpacity disabled={item.type !== 'location'} onPress={() => openMap(item)} style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={[styles.body, mine && styles.mineText]}>{item.type === 'location' ? `📍 Xem vị trí\n${item.latitude}, ${item.longitude}` : item.text}</Text><Text style={[styles.time, mine && styles.mineTime]}>{formatTime(item.createdAt)}</Text></TouchableOpacity>;
    }} />}
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.composer}><TouchableOpacity style={styles.location} onPress={shareLocation} disabled={busy} accessibilityLabel="Gửi vị trí"><Text style={styles.locationText}>📍</Text></TouchableOpacity><TextInput style={styles.input} placeholder="Nhập tin nhắn..." value={text} onChangeText={setText} multiline /><TouchableOpacity style={[common.button, styles.send]} onPress={send} disabled={busy || !text.trim()}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={common.buttonText}>Gửi</Text>}</TouchableOpacity></View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({header: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border}, back: {paddingRight: 12}, backText: {fontSize: 32, color: colors.primary, lineHeight: 36}, headerDetails: {marginLeft: 12}, headerName: {fontSize: 17, fontWeight: '700', color: colors.text}, headerStatus: {color: colors.muted, fontSize: 12}, center: {flex: 1, justifyContent: 'center'}, messages: {padding: 16, flexGrow: 1}, bubble: {maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginBottom: 10}, mine: {alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4}, theirs: {alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4}, body: {color: colors.text, fontSize: 15, lineHeight: 21}, mineText: {color: colors.white}, time: {color: colors.muted, fontSize: 11, marginTop: 4, alignSelf: 'flex-end'}, mineTime: {color: '#ddd6fe'}, composer: {flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.white, padding: 8, borderTopWidth: 1, borderTopColor: colors.border}, input: {flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12, color: colors.text}, location: {height: 44, justifyContent: 'center', paddingHorizontal: 8}, locationText: {fontSize: 22}, send: {minHeight: 44, marginLeft: 8}, error: {color: colors.error, paddingHorizontal: 16, paddingVertical: 5}});
