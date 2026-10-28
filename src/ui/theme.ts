import {StyleSheet} from 'react-native';

export const colors = {primary: '#4f46e5', background: '#f8f9fc', white: '#ffffff', text: '#111827', muted: '#6b7280', border: '#e5e7eb', error: '#dc2626', online: '#22c55e'};
export const common = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: 20},
  title: {fontSize: 26, fontWeight: '700', color: colors.text},
  subtitle: {fontSize: 14, color: colors.muted, marginTop: 4},
  input: {backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, color: colors.text, marginTop: 12},
  button: {backgroundColor: colors.primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16},
  buttonText: {color: colors.white, fontSize: 16, fontWeight: '700'},
  error: {color: colors.error, marginTop: 12},
  empty: {color: colors.muted, textAlign: 'center', marginTop: 36, lineHeight: 22},
  row: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border},
});
