import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {firebaseConfigured} from './src/services/firebase';
import {subscribeUser, UserProfile} from './src/services/userService';
import {startPresence} from './src/services/presenceService';
import {RootNavigation} from './src/navigation/RootNavigation';
import {AuthAccount, friendlyError, logout, subscribeAuth} from './src/services/authService';

export default function App() {
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!firebaseConfigured) {setReady(true); return;}
    return subscribeAuth(current => {
      setAccount(current);
      setProfile(null);
      setProfileError('');
      if (!current) {setReady(true);}
    });
  }, []);

  useEffect(() => {
    if (!account) {return;}
    return subscribeUser(account.uid, value => {
      setProfile(value);
      setProfileError(value ? '' : 'Không tìm thấy hồ sơ người dùng trong Database.');
      setReady(true);
    }, cause => {setProfileError(friendlyError(cause)); setReady(true);});
  }, [account]);

  useEffect(() => {
    if (!account || !profile) {return;}
    return startPresence(account.uid);
  }, [account, profile]);

  return <SafeAreaProvider>
    <StatusBar barStyle="dark-content" />
    {!firebaseConfigured ? <View style={styles.center}><Text style={styles.title}>Cần cấu hình Firebase</Text><Text style={styles.text}>Điền thông tin dự án thật vào src/config/firebaseConfig.ts theo README.</Text></View>
      : !ready ? <View style={styles.center}><ActivityIndicator color="#4f46e5" /><Text style={styles.text}>Đang tải tài khoản...</Text></View>
      : account && !profile ? <View style={styles.center}><Text style={styles.title}>Không thể mở tài khoản</Text><Text style={styles.text}>{profileError || 'Đang tải hồ sơ...'}</Text><TouchableOpacity onPress={() => logout().catch(() => {})} style={styles.logout}><Text style={styles.logoutText}>Đăng xuất</Text></TouchableOpacity></View>
      : <RootNavigation key={account?.uid ?? 'guest'} account={account} profile={profile} />}
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24}, title: {fontSize: 20, fontWeight: '700', color: '#111827'}, text: {marginTop: 12, textAlign: 'center', color: '#6b7280'}, logout: {marginTop: 20, padding: 12}, logoutText: {color: '#4f46e5', fontWeight: '700'}});
