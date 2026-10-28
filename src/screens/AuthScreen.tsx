import React, {useState} from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity} from 'react-native';
import {friendlyError, login, register} from '../services/authService';
import {colors, common} from '../ui/theme';

export function AuthScreen() {
  const [isRegister, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const address = email.trim();
    if (isRegister && !name.trim()) {setError('Vui lòng nhập họ tên.'); return;}
    if (!address || !password || (isRegister && !confirm)) {setError('Vui lòng điền đầy đủ thông tin.'); return;}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {setError('Email không hợp lệ.'); return;}
    if (isRegister && password.length < 6) {setError('Mật khẩu cần ít nhất 6 ký tự.'); return;}
    if (isRegister && password !== confirm) {setError('Mật khẩu xác nhận không khớp.'); return;}
    setError(''); setBusy(true);
    try {if (isRegister) {await register(name, address, password);} else {await login(address, password);}}
    catch (cause) {setError(friendlyError(cause));}
    finally {setBusy(false);}
  };
  return <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={common.title}>{isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</Text>
      <Text style={common.subtitle}>{isRegister ? 'Đăng ký để bắt đầu trò chuyện' : 'Đăng nhập để tiếp tục trò chuyện'}</Text>
      {isRegister && <TextInput style={common.input} placeholder="Họ và tên" value={name} onChangeText={setName} autoCapitalize="words" />}
      <TextInput style={common.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <TextInput style={common.input} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoComplete={isRegister ? 'new-password' : 'current-password'} />
      {isRegister && <TextInput style={common.input} placeholder="Xác nhận mật khẩu" value={confirm} onChangeText={setConfirm} secureTextEntry />}
      {!!error && <Text style={common.error}>{error}</Text>}
      <TouchableOpacity style={[common.button, styles.submit]} onPress={submit} disabled={busy}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={common.buttonText}>{isRegister ? 'Đăng ký' : 'Đăng nhập'}</Text>}</TouchableOpacity>
      <TouchableOpacity onPress={() => {setRegister(!isRegister); setError('');}} style={styles.switch}><Text style={styles.link}>{isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</Text></TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({container: {flexGrow: 1, justifyContent: 'center', padding: 24}, submit: {marginTop: 20}, switch: {alignItems: 'center', padding: 18}, link: {color: colors.primary, fontWeight: '600'}});
