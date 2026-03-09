export type Locale = 'vi' | 'en';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
];

const dict = {
  vi: {
    today: 'Hôm nay',
    schedule: 'Lịch',
    live: 'Đang diễn ra',
    upcoming: 'Sắp diễn ra',
    finished: 'Kết thúc',
    matchCenter: 'Trung tâm trận',
    watch: 'Xem stream',
    odds: 'Bảng kèo',
    standings: 'Bảng xếp hạng',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    favorites: 'Theo dõi',
    reload: 'Tải lại',
    email: 'Email',
    password: 'Mật khẩu',
    displayName: 'Tên hiển thị',
    submit: 'Xác nhận',
  },
  en: {
    today: 'Today',
    schedule: 'Schedule',
    live: 'Live',
    upcoming: 'Upcoming',
    finished: 'Finished',
    matchCenter: 'Match center',
    watch: 'Watch stream',
    odds: 'Odds',
    standings: 'Standings',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    favorites: 'Favorites',
    reload: 'Reload',
    email: 'Email',
    password: 'Password',
    displayName: 'Display name',
    submit: 'Submit',
  },
} as const;

export type I18nKey = keyof typeof dict.vi;

export function getLocaleFromCookie(cookie?: string | null): Locale {
  const c = cookie ?? '';
  const m = c.match(/(?:^|; )locale=(vi|en)(?:;|$)/);
  return (m?.[1] as Locale) ?? 'vi';
}

export function t(locale: Locale, key: I18nKey): string {
  return dict[locale][key] ?? dict.vi[key] ?? key;
}
