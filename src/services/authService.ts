import {createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User} from 'firebase/auth';
import {auth} from './firebase';
import {createUserProfile} from './userService';
import {stopPresence} from './presenceService';

function requiredAuth() {if (!auth) {throw new Error('Firebase chưa được cấu hình.');} return auth;}
export type AuthAccount = User;
export function subscribeAuth(update: (account: AuthAccount | null) => void) {return onAuthStateChanged(requiredAuth(), update);}
export async function register(fullName: string, email: string, password: string) {
  const credentials = await createUserWithEmailAndPassword(requiredAuth(), email.trim(), password);
  try {await createUserProfile(credentials.user.uid, fullName.trim(), email.trim().toLowerCase());}
  catch (error) {await signOut(requiredAuth()); throw error;}
}
export function login(email: string, password: string) {return signInWithEmailAndPassword(requiredAuth(), email.trim(), password);}
export async function logout() {await stopPresence().catch(() => {}); await signOut(requiredAuth());}
export function friendlyError(error: unknown) {
  const code = (error as {code?: string})?.code;
  switch (code) {
    case 'auth/email-already-in-use': return 'Email này đã được đăng ký.';
    case 'auth/invalid-email': return 'Email không hợp lệ.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'Email hoặc mật khẩu không đúng.';
    case 'auth/network-request-failed':
    case 'database/network-error': return 'Không thể kết nối mạng. Vui lòng thử lại.';
    case 'PERMISSION_DENIED':
    case 'database/permission-denied': return 'Firebase từ chối quyền truy cập. Kiểm tra Database Rules.';
    default: return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}
