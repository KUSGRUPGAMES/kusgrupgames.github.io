/** Français — interface de base (§61). Les clés manquantes reviennent au turc. */
import type { StringKey } from './tr';

export const fr: Partial<Record<StringKey, string>> = {
  'nav.home': 'Accueil', 'nav.quran': 'Coran', 'nav.worship': 'Adoration',
  'nav.explore': 'Explorer', 'nav.profile': 'Profil', 'nav.back': 'Retour', 'nav.close': 'Fermer',

  'common.ok': 'OK', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer',
  'common.delete': 'Supprimer', 'common.edit': 'Modifier', 'common.done': 'Terminé',
  'common.next': 'Suivant', 'common.skip': 'Passer', 'common.retry': 'Réessayer',
  'common.search': 'Rechercher', 'common.share': 'Partager', 'common.copy': 'Copier',
  'common.select': 'Choisir', 'common.loading': 'Chargement', 'common.today': "Aujourd'hui",
  'common.source': 'Source', 'common.enable': 'Activé', 'common.disable': 'Désactivé',

  'prayer.fajr': 'Fajr', 'prayer.sunrise': 'Lever du soleil', 'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Icha',
  'prayer.next': 'Prochaine prière', 'prayer.remaining': 'Temps restant',
  'prayer.remainingTo': '{time} avant {name}',
  'prayer.todayTimes': "Horaires d'aujourd'hui", 'prayer.method': 'Méthode de calcul',
  'prayer.adjustment': 'Correction en minutes',

  'location.title': 'Position', 'location.current': 'Position actuelle',
  'location.useGps': 'Utiliser ma position', 'location.manual': 'Choisir manuellement',
  'location.permissionTitle': "Autorisation de localisation requise",
  'location.permissionBody': "Les horaires de prière sont calculés pour l'endroit où vous êtes. Si vous préférez ne pas donner l'accès, vous pouvez choisir votre ville manuellement.",
  'location.timezone': 'Fuseau horaire',

  'qibla.title': 'Qibla', 'qibla.bearing': 'Direction de la Qibla', 'qibla.noHeading': 'Pas de lecture de boussole ; utilise l’angle ci-dessous',
  'qibla.distance': 'Distance jusqu’à la Kaaba', 'qibla.aligned': 'Vous êtes face à la Qibla',

  'quran.title': 'Coran', 'quran.surahs': 'Sourates', 'quran.juz': 'Juz',
  'quran.continue': 'Reprendre la lecture', 'quran.translation': 'Traduction',
  'quran.bookmarks': 'Signets', 'quran.favorites': 'Favoris',

  'worship.title': 'Adoration', 'worship.dhikr': 'Compteur de dhikr', 'dhikr.pick': 'Choisir un dhikr', 'worship.duas': 'Invocations',
  'worship.names': 'Les noms d’Allah', 'worship.qada': 'Prières manquées',

  'explore.title': 'Explorer', 'profile.title': 'Profil', 'profile.signIn': 'Se connecter',
  'profile.signOut': 'Se déconnecter', 'profile.guest': 'Continuer en invité',

  'settings.title': 'Réglages', 'settings.theme': 'Thème', 'settings.themeSystem': 'Système',
  'settings.themeLight': 'Clair', 'settings.themeDark': 'Sombre', 'settings.language': 'Langue',
  'settings.notifications': 'Notifications', 'settings.about': 'À propos',
  'settings.privacy': 'Confidentialité', 'settings.version': 'Version',

  'pro.title': 'Pro', 'pro.unlock': 'Débloquer avec Pro', 'pro.monthly': 'Mensuel',
  'pro.yearly': 'Annuel', 'pro.restore': 'Restaurer les achats',

  'error.title': 'Une erreur est survenue', 'error.generic': "L'opération n'a pas abouti. Réessayez dans un instant.",
  'error.network': 'Pas de connexion Internet.', 'error.timeout': 'La requête a expiré.',
  'error.restart': 'Redémarrer',
  'offline.title': 'Vous êtes hors ligne',
  'offline.body': 'Les horaires, le Coran et le dhikr fonctionnent hors ligne. La synchronisation reprend au retour de la connexion.',
  'empty.title': 'Rien ici pour le moment', 'empty.body': 'Ce que vous ajoutez apparaîtra ici.',
  'backup.title': 'Sauvegarde',
  'backup.why': 'Vos données restent sur votre téléphone. Créez un fichier de sauvegarde avant de changer de téléphone ou de supprimer l\u2019application.',
  'backup.export': 'Créer un fichier de sauvegarde',
  'backup.exportBody': 'Lieux, signets, favoris, dhikr, prières à rattraper, journal et jeûnes dans un seul fichier.',
  'backup.exported': 'Sauvegarde prête',
  'backup.exportFailed': 'Impossible de créer la sauvegarde',
  'backup.import': 'Restaurer depuis une sauvegarde',
  'backup.importBody': 'Choisissez un fichier de sauvegarde enregistré auparavant.',
  'backup.importFailed': 'Impossible de lire la sauvegarde',
  'backup.errorRead': 'Le fichier n\u2019a pas pu être ouvert.',
  'backup.errorCorrupt': 'Le fichier semble endommagé.',
  'backup.errorNotBackup': 'Ce n\u2019est pas une sauvegarde {app}.',
  'backup.errorNewer': 'Cette sauvegarde provient d\u2019une version plus récente. Mettez d\u2019abord l\u2019application à jour.',
  'backup.restoreTitle': 'Comment restaurer ?',
  'backup.fileInfo': '{date} · version {version}',
  'backup.modeMerge': 'Fusionner',
  'backup.modeMergeBody': 'Rien n\u2019est supprimé. Les entrées présentes seulement dans la sauvegarde sont ajoutées ; en cas de doublon, la plus récente est conservée.',
  'backup.modeReplace': 'Remplacer par la sauvegarde',
  'backup.modeReplaceBody': 'Les données de cet appareil sont remplacées par celles de la sauvegarde. Choisissez ceci pour un nouveau téléphone.',
  'backup.restored': 'Restauré',
  'backup.restoredMerge': '{count} entrées ajoutées.',
  'backup.restoredReplace': 'Tout le contenu de la sauvegarde a été chargé.',
  'backup.countersKept': 'Les compteurs de prières à rattraper et les réglages de cet appareil ont été conservés.',
};
