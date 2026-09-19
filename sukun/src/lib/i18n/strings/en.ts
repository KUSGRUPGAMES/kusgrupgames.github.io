/** English — core UI (§61). Missing keys fall back to Turkish. */
import type { StringKey } from './tr';

export const en: Partial<Record<StringKey, string>> = {
  'nav.home': 'Home', 'nav.quran': 'Quran', 'nav.worship': 'Worship',
  'nav.explore': 'Explore', 'nav.profile': 'Profile', 'nav.back': 'Back', 'nav.close': 'Close',

  'common.ok': 'OK', 'common.cancel': 'Cancel', 'common.save': 'Save',
  'common.delete': 'Delete', 'common.edit': 'Edit', 'common.done': 'Done',
  'common.next': 'Next', 'common.skip': 'Skip', 'common.retry': 'Try again',
  'common.search': 'Search', 'common.share': 'Share', 'common.copy': 'Copy',
  'common.select': 'Select', 'common.loading': 'Loading', 'common.today': 'Today',
  'common.source': 'Source', 'common.enable': 'On', 'common.disable': 'Off',

  'prayer.fajr': 'Fajr', 'prayer.sunrise': 'Sunrise', 'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Isha',
  'prayer.next': 'Next prayer', 'prayer.remaining': 'Time remaining',
  'prayer.remainingTo': '{time} until {name}',
  'prayer.todayTimes': "Today's times", 'prayer.method': 'Calculation method',
  'prayer.adjustment': 'Minute adjustment',

  'location.title': 'Location', 'location.current': 'Current location',
  'location.useGps': 'Use my location', 'location.manual': 'Choose manually',
  'location.permissionTitle': 'Location permission needed',
  'location.permissionBody': 'Prayer times are calculated for where you are. If you prefer not to grant access, you can pick your city manually.',
  'location.timezone': 'Time zone',

  'qibla.title': 'Qibla', 'qibla.bearing': 'Qibla direction', 'qibla.noHeading': 'No compass reading; use the bearing below',
  'qibla.distance': 'Distance to the Kaaba', 'qibla.aligned': 'You are facing the Qibla',

  'quran.title': 'Quran', 'quran.surahs': 'Surahs', 'quran.juz': 'Juz',
  'quran.continue': 'Continue where you left off', 'quran.translation': 'Translation',
  'quran.bookmarks': 'Bookmarks', 'quran.favorites': 'Favourites',

  'worship.title': 'Worship', 'worship.dhikr': 'Dhikr counter', 'dhikr.pick': 'Choose a dhikr', 'worship.duas': 'Supplications',
  'worship.names': 'Names of Allah', 'worship.qada': 'Missed prayers',

  'explore.title': 'Explore', 'profile.title': 'Profile', 'profile.signIn': 'Sign in',
  'profile.signOut': 'Sign out', 'profile.guest': 'Continue as guest',

  'settings.title': 'Settings', 'settings.theme': 'Theme', 'settings.themeSystem': 'System',
  'settings.themeLight': 'Light', 'settings.themeDark': 'Dark', 'settings.language': 'Language',
  'settings.notifications': 'Notifications', 'settings.about': 'About',
  'settings.privacy': 'Privacy', 'settings.version': 'Version',

  'pro.title': 'Pro', 'pro.unlock': 'Unlock with Pro', 'pro.monthly': 'Monthly',
  'pro.yearly': 'Yearly', 'pro.restore': 'Restore purchases',

  'error.title': 'Something went wrong', 'error.generic': 'That did not go through. Please try again shortly.',
  'error.network': 'No internet connection.', 'error.timeout': 'The request timed out.',
  'error.restart': 'Restart',
  'offline.title': 'You are offline',
  'offline.body': 'Prayer times, the Quran and dhikr work offline. Syncing resumes when you reconnect.',
  'empty.title': 'Nothing here yet', 'empty.body': 'What you add will show up here.',
};
