import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl?: string;
  watchBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const API_BASE_URL = (extra.apiBaseUrl ?? 'https://api.tintuc360.net').replace(/\/+$/, '');
export const WATCH_BASE_URL = (extra.watchBaseUrl ?? 'https://app.tintuc360.net').replace(/\/+$/, '');
