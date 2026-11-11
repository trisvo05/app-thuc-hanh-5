import {get, onValue, push, ref, serverTimestamp, update} from 'firebase/database';
import {database} from './firebase';
export type AppNotification = {id: string; type: string; convId: string; fromUid: string; text: string; createdAt: number; read: boolean};
function db() {if (!database) {throw new Error('Firebase chưa được cấu hình.');} return database;}
export async function createNotification(uid: string, value: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {const item = push(ref(db(), `notifications/${uid}`)); if (!item.key) {return;} await update(ref(db()), {[`notifications/${uid}/${item.key}`]: {...value, createdAt: serverTimestamp(), read: false}});}
export function subscribeNotifications(uid: string, callback: (items: AppNotification[]) => void, error: (error: Error) => void) {return onValue(ref(db(), `notifications/${uid}`), snap => callback(Object.entries(snap.val() ?? {}).map(([id, item]) => ({id, ...(item as Omit<AppNotification, 'id'>)})).sort((a, b) => b.createdAt - a.createdAt)), error);}
export async function markNotificationRead(uid: string, id: string) {await update(ref(db(), `notifications/${uid}/${id}`), {read: true});}
export async function markAllNotificationsRead(uid: string) {const snap = await get(ref(db(), `notifications/${uid}`)); const updates: Record<string, boolean> = {}; Object.entries(snap.val() ?? {}).forEach(([id, value]) => {if (!(value as AppNotification).read) {updates[`${id}/read`] = true;}}); if (Object.keys(updates).length) {await update(ref(db(), `notifications/${uid}`), updates);}}
