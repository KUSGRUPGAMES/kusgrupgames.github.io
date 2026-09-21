/** Deutsch — Basis-Oberfläche (§61). Fehlende Schlüssel fallen auf Türkisch zurück. */
import type { StringKey } from './tr';

export const de: Partial<Record<StringKey, string>> = {
  'nav.home': 'Start', 'nav.quran': 'Koran', 'nav.worship': 'Gottesdienst',
  'nav.explore': 'Entdecken', 'nav.profile': 'Profil', 'nav.back': 'Zurück', 'nav.close': 'Schließen',

  'common.ok': 'OK', 'common.cancel': 'Abbrechen', 'common.save': 'Speichern',
  'common.delete': 'Löschen', 'common.edit': 'Bearbeiten', 'common.done': 'Fertig',
  'common.next': 'Weiter', 'common.skip': 'Überspringen', 'common.retry': 'Erneut versuchen',
  'common.search': 'Suchen', 'common.share': 'Teilen', 'common.copy': 'Kopieren',
  'common.select': 'Auswählen', 'common.loading': 'Wird geladen', 'common.today': 'Heute',
  'common.source': 'Quelle', 'common.enable': 'Ein', 'common.disable': 'Aus',

  'prayer.fajr': 'Fadschr', 'prayer.sunrise': 'Sonnenaufgang', 'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Ischa',
  'prayer.next': 'Nächstes Gebet', 'prayer.remaining': 'Verbleibende Zeit',
  'prayer.remainingTo': 'Noch {time} bis {name}',
  'prayer.todayTimes': 'Heutige Zeiten', 'prayer.method': 'Berechnungsmethode',
  'prayer.adjustment': 'Korrektur in Minuten',

  'location.title': 'Standort', 'location.current': 'Aktueller Standort',
  'location.useGps': 'Meinen Standort verwenden', 'location.manual': 'Manuell wählen',
  'location.permissionTitle': 'Standortfreigabe nötig',
  'location.permissionBody': 'Die Gebetszeiten werden für deinen Ort berechnet. Wenn du keine Freigabe erteilen möchtest, kannst du deine Stadt manuell wählen.',
  'location.timezone': 'Zeitzone',

  'qibla.title': 'Qibla', 'qibla.bearing': 'Qibla-Richtung', 'qibla.noHeading': 'Kein Kompasswert; nutze den Winkel unten',
  'qibla.distance': 'Entfernung zur Kaaba', 'qibla.aligned': 'Du bist zur Qibla ausgerichtet',

  'quran.title': 'Koran', 'quran.surahs': 'Suren', 'quran.juz': 'Dschuz',
  'quran.continue': 'Weiterlesen', 'quran.translation': 'Übersetzung',
  'quran.bookmarks': 'Lesezeichen', 'quran.favorites': 'Favoriten',

  'worship.title': 'Gottesdienst', 'worship.dhikr': 'Dhikr-Zähler', 'dhikr.pick': 'Dhikr wählen', 'worship.duas': 'Bittgebete',
  'worship.names': 'Die Namen Allahs', 'worship.qada': 'Nachzuholende Gebete',

  'explore.title': 'Entdecken', 'profile.title': 'Profil', 'profile.signIn': 'Anmelden',
  'profile.signOut': 'Abmelden', 'profile.guest': 'Als Gast fortfahren',

  'settings.title': 'Einstellungen', 'settings.theme': 'Design', 'settings.themeSystem': 'System',
  'settings.themeLight': 'Hell', 'settings.themeDark': 'Dunkel', 'settings.language': 'Sprache',
  'settings.notifications': 'Mitteilungen', 'settings.about': 'Über die App',
  'settings.privacy': 'Datenschutz', 'settings.version': 'Version',

  'pro.title': 'Pro', 'pro.unlock': 'Mit Pro freischalten', 'pro.monthly': 'Monatlich',
  'pro.yearly': 'Jährlich', 'pro.restore': 'Käufe wiederherstellen',

  'error.title': 'Etwas ist schiefgelaufen', 'error.generic': 'Das hat nicht geklappt. Bitte versuche es gleich noch einmal.',
  'error.network': 'Keine Internetverbindung.', 'error.timeout': 'Zeitüberschreitung der Anfrage.',
  'error.restart': 'Neu starten',
  'offline.title': 'Du bist offline',
  'offline.body': 'Gebetszeiten, Koran und Dhikr funktionieren offline. Die Synchronisierung läuft weiter, sobald du wieder verbunden bist.',
  'empty.title': 'Hier ist noch nichts', 'empty.body': 'Was du hinzufügst, erscheint hier.',
  'backup.title': 'Sicherung',
  'backup.why': 'Deine Daten bleiben auf dem Telefon. Erstelle eine Sicherungsdatei, bevor du das Telefon wechselst oder die App löschst.',
  'backup.export': 'Sicherungsdatei erstellen',
  'backup.exportBody': 'Orte, Lesezeichen, Favoriten, Dhikr, Nachholgebete, Gebetstagebuch und Fasten in einer Datei.',
  'backup.exported': 'Sicherung bereit',
  'backup.exportFailed': 'Sicherung konnte nicht erstellt werden',
  'backup.import': 'Aus einer Sicherung wiederherstellen',
  'backup.importBody': 'Wähle eine zuvor gespeicherte Sicherungsdatei.',
  'backup.importFailed': 'Sicherung konnte nicht gelesen werden',
  'backup.errorRead': 'Die Datei konnte nicht geöffnet werden.',
  'backup.errorCorrupt': 'Die Datei scheint beschädigt zu sein.',
  'backup.errorNotBackup': 'Das ist keine {app}-Sicherung.',
  'backup.errorNewer': 'Diese Sicherung stammt aus einer neueren Version. Aktualisiere zuerst die App.',
  'backup.restoreTitle': 'Wie soll wiederhergestellt werden?',
  'backup.fileInfo': '{date} · Version {version}',
  'backup.modeMerge': 'Zusammenführen',
  'backup.modeMergeBody': 'Nichts von dir wird gelöscht. Nur in der Sicherung vorhandene Einträge werden ergänzt; bei gleichen Einträgen bleibt der neuere.',
  'backup.modeReplace': 'Durch die Sicherung ersetzen',
  'backup.modeReplaceBody': 'Die Daten auf diesem Gerät werden durch die der Sicherung ersetzt. Wähle das beim Wechsel auf ein neues Telefon.',
  'backup.restored': 'Wiederhergestellt',
  'backup.restoredMerge': '{count} Einträge hinzugefügt.',
  'backup.restoredReplace': 'Alles aus der Sicherung wurde geladen.',
  'backup.countersKept': 'Zähler für Nachholgebete und Einstellungen dieses Geräts wurden beibehalten.',
};
