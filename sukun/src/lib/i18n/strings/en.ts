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
  'backup.title': 'Backup',
  'backup.why': 'Your records stay on your phone. Take a backup file before switching phones or deleting the app.',
  'backup.export': 'Create a backup file',
  'backup.exportBody': 'Locations, bookmarks, favourites, dhikr, missed prayers, worship log and fasting, in one file.',
  'backup.exported': 'Backup ready',
  'backup.exportFailed': 'Could not create the backup',
  'backup.import': 'Restore from a backup',
  'backup.importBody': 'Pick a backup file you saved earlier.',
  'backup.importFailed': 'Could not read the backup',
  'backup.errorRead': 'The file could not be opened.',
  'backup.errorCorrupt': 'The file looks damaged.',
  'backup.errorNotBackup': 'This is not a {app} backup.',
  'backup.errorNewer': 'This backup comes from a newer version. Update the app first.',
  'backup.restoreTitle': 'How should it be restored?',
  'backup.fileInfo': '{date} · version {version}',
  'backup.modeMerge': 'Merge',
  'backup.modeMergeBody': 'Nothing of yours is deleted. Records only in the backup are added; where both have the same record, the newer one stays.',
  'backup.modeReplace': 'Replace with the backup',
  'backup.modeReplaceBody': 'Records on this device are replaced by the ones in the backup. Choose this when moving to a new phone.',
  'backup.restored': 'Restored',
  'backup.restoredMerge': '{count} records added.',
  'backup.restoredReplace': 'Everything from the backup was loaded.',
  'backup.countersKept': 'Missed-prayer counters and settings on this device were kept.',
};
