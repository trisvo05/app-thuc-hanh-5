import React, {useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {friendlyError, logout} from '../services/authService';
import {UserProfile} from '../services/userService';
import {Avatar} from '../ui/Avatar';
import {colors, common} from '../ui/theme';

export function SettingsScreen({profile}: {profile: UserProfile}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signOut = async () => {setBusy(true); setError(''); try {await logout();} catch (cause) {setError(friendlyError(cause)); setBusy(false);}};
  return <View style={common.screen}><View style={common.content}><Text style={common.title}>Cài đặt</Text><View style={styles.profile}><Avatar name={profile.fullName} uri={profile.avatarUrl} size={56} /><View style={styles.details}><Text style={styles.name}>{profile.fullName}</Text><Text style={common.subtitle}>{profile.email}</Text></View></View><TouchableOpacity style={common.button} onPress={signOut} disabled={busy}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={common.buttonText}>Đăng xuất</Text>}</TouchableOpacity>{!!error && <Text style={common.error}>{error}</Text>}</View></View>;
}
const styles = StyleSheet.create({profile: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 16, marginVertical: 24}, details: {marginLeft: 14}, name: {fontSize: 18, fontWeight: '700', color: colors.text}});
