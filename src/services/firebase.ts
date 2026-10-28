import {getApp, getApps, initializeApp} from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {getDatabase} from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {firebaseConfig} from '../config/firebaseConfig';

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
// Firebase exports this function at runtime for React Native, while its generic
// TypeScript entry point omits the React Native-specific declaration.
const getReactNativePersistence = (FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
}).getReactNativePersistence;
export const auth = app ? (() => {
  try {return FirebaseAuth.initializeAuth(app, {persistence: getReactNativePersistence(AsyncStorage)});}
  catch (error) {
    if ((error as {code?: string}).code === 'auth/already-initialized') {return FirebaseAuth.getAuth(app);}
    throw error;
  }
})() : null;
export const database = app ? getDatabase(app) : null;
