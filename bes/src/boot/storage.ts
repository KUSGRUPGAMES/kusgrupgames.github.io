/**
 * Uygulamanın gerçek depo örnekleri — şartname §5.
 * Platform bağımlılıkları yalnız burada toplanır; iş katmanı arayüzleri kullanır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSecureStore from 'expo-secure-store';
import { KeyValueStore, SecureStore } from '@/lib/storage';

export const kv = new KeyValueStore({
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
});

export const secure = new SecureStore({
  getItemAsync: (k) => ExpoSecureStore.getItemAsync(k),
  setItemAsync: (k, v) => ExpoSecureStore.setItemAsync(k, v),
  deleteItemAsync: (k) => ExpoSecureStore.deleteItemAsync(k),
});
