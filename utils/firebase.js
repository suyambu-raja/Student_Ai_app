import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: "ai-student-app-87876.firebaseapp.com",
  projectId: "ai-student-app-87876",
  storageBucket: "ai-student-app-87876.firebasestorage.app",
  messagingSenderId: "1053924975391",
  appId: "1:1053924975391:web:a6d110e06f0f09a0ae862a",
  measurementId: "G-4DR97FP146"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
