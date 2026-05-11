import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const getMetroHostBaseUrl = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const match = scriptURL.match(/https?:\/\/([^/:]+)(?::\d+)?/);

  if (!match?.[1]) {
    return null;
  }

  return `http://${match[1]}:5000`;
};

const metroHostBaseUrl = getMetroHostBaseUrl();
const localBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_BASE_URL = (envBaseUrl || metroHostBaseUrl || localBaseUrl).replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}/api`;

console.log('====================================');
console.log('API_BASE_URL RESOLVED TO:', API_BASE_URL);
console.log('====================================');

export const buildAssetUrl = (assetPath) => {
  if (!assetPath || assetPath === 'no-photo.jpg' || assetPath === 'no-cover.jpg') {
    return 'https://via.placeholder.com/800x400.png?text=No+Image';
  }

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  // Normalize Windows backslashes to forward slashes for URLs
  const normalizedPath = assetPath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${API_BASE_URL}/${normalizedPath}`;
};

const api = axios.create({
  baseURL: API_URL,
});

// 🟢 Request interceptor to automatically attach JWT tokens from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error fetching token from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
