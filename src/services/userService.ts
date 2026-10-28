import {onValue, ref, serverTimestamp, set} from 'firebase/database';
import {database} from './firebase';

export type UserProfile = {uid: string; fullName: string; email: string; avatarUrl?: string};
function db() {if (!database) {throw new Error('Firebase chưa được cấu hình.');} return database;}
export function createUserProfile(uid: string, fullName: string, email: string) {
  return set(ref(db(), `users/${uid}`), {uid, fullName, email, createdAt: serverTimestamp()});
}
export function subscribeUser(uid: string, update: (user: UserProfile | null) => void, error: (error: Error) => void) {
  return onValue(ref(db(), `users/${uid}`), snap => update(snap.val() as UserProfile | null), error);
}
export function subscribeUsers(update: (users: UserProfile[]) => void, error: (error: Error) => void) {
  return onValue(ref(db(), 'users'), snap => update(Object.values(snap.val() ?? {}) as UserProfile[]), error);
}
