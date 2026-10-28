import {onDisconnect, onValue, ref, serverTimestamp, set} from 'firebase/database';
import {database} from './firebase';

function db() {if (!database) {throw new Error('Firebase chưa được cấu hình.');} return database;}
let stopCurrentPresence: (() => Promise<void>) | null = null;
export async function stopPresence() {if (stopCurrentPresence) {await stopCurrentPresence();}}
export function startPresence(uid: string) {
  let active = true;
  const presenceRef = ref(db(), `presence/${uid}`);
  const unsubscribe = onValue(ref(db(), '.info/connected'), async snap => {
    if (!snap.val() || !active) {return;}
    try {
      // Rules của giảng viên yêu cầu online và lastSeen trên cùng node.
      await onDisconnect(presenceRef).set({online: false, lastSeen: serverTimestamp()});
      if (active) {await set(presenceRef, {online: true, lastSeen: serverTimestamp()});}
    } catch (error) {console.warn('Presence failed:', error);}
  });
  const stop = async () => {
    if (!active) {return;}
    active = false;
    unsubscribe();
    try {await set(presenceRef, {online: false, lastSeen: serverTimestamp()});}
    finally {await onDisconnect(presenceRef).cancel();}
    if (stopCurrentPresence === stop) {stopCurrentPresence = null;}
  };
  stopCurrentPresence = stop;
  return () => {stop().catch(() => {});};
}
export function subscribePresence(update: (online: Record<string, boolean>) => void, error: (error: Error) => void) {
  return onValue(ref(db(), 'presence'), snap => {
    const raw = snap.val() ?? {};
    const result: Record<string, boolean> = {};
    Object.keys(raw).forEach(uid => {result[uid] = raw[uid]?.online === true;});
    update(result);
  }, error);
}
