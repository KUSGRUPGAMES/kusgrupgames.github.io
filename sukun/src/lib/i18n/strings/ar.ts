/** العربية — واجهة أساسية (§61). المفاتيح الناقصة تعود إلى التركية. */
import type { StringKey } from './tr';

export const ar: Partial<Record<StringKey, string>> = {
  'nav.home': 'الرئيسية', 'nav.quran': 'القرآن', 'nav.worship': 'العبادة',
  'nav.explore': 'استكشاف', 'nav.profile': 'الحساب', 'nav.back': 'رجوع', 'nav.close': 'إغلاق',

  'common.ok': 'حسناً', 'common.cancel': 'إلغاء', 'common.save': 'حفظ',
  'common.delete': 'حذف', 'common.edit': 'تعديل', 'common.done': 'تم',
  'common.next': 'التالي', 'common.skip': 'تخطٍ', 'common.retry': 'أعد المحاولة',
  'common.search': 'بحث', 'common.share': 'مشاركة', 'common.copy': 'نسخ',
  'common.select': 'اختيار', 'common.loading': 'جارٍ التحميل', 'common.today': 'اليوم',
  'common.source': 'المصدر', 'common.enable': 'تشغيل', 'common.disable': 'إيقاف',

  'prayer.fajr': 'الفجر', 'prayer.sunrise': 'الشروق', 'prayer.dhuhr': 'الظهر',
  'prayer.asr': 'العصر', 'prayer.maghrib': 'المغرب', 'prayer.isha': 'العشاء',
  'prayer.next': 'الصلاة القادمة', 'prayer.remaining': 'الوقت المتبقي',
  'prayer.remainingTo': 'يتبقى {time} على {name}',
  'prayer.todayTimes': 'مواقيت اليوم', 'prayer.method': 'طريقة الحساب',
  'prayer.adjustment': 'تعديل بالدقائق',

  'location.title': 'الموقع', 'location.current': 'الموقع الحالي',
  'location.useGps': 'استخدم موقعي', 'location.manual': 'اختر يدوياً',
  'location.permissionTitle': 'نحتاج إذن الموقع',
  'location.permissionBody': 'تُحسب مواقيت الصلاة حسب مكانك. وإن لم ترغب في منح الإذن فيمكنك اختيار مدينتك يدوياً.',
  'location.timezone': 'المنطقة الزمنية',

  'qibla.title': 'القبلة', 'qibla.bearing': 'اتجاه القبلة', 'qibla.noHeading': 'تعذّرت قراءة البوصلة؛ استعمل الزاوية أدناه',
  'qibla.distance': 'المسافة إلى الكعبة', 'qibla.aligned': 'أنت مستقبل القبلة',

  'quran.title': 'القرآن', 'quran.surahs': 'السور', 'quran.juz': 'الأجزاء',
  'quran.continue': 'تابع من حيث توقفت', 'quran.translation': 'الترجمة',
  'quran.bookmarks': 'العلامات', 'quran.favorites': 'المفضلة',

  'worship.title': 'العبادة', 'worship.dhikr': 'المسبحة', 'dhikr.pick': 'اختر الذكر', 'worship.duas': 'الأدعية',
  'worship.names': 'أسماء الله الحسنى', 'worship.qada': 'الصلوات الفائتة',

  'explore.title': 'استكشاف', 'profile.title': 'الحساب', 'profile.signIn': 'تسجيل الدخول',
  'profile.signOut': 'تسجيل الخروج', 'profile.guest': 'المتابعة كضيف',

  'settings.title': 'الإعدادات', 'settings.theme': 'المظهر', 'settings.themeSystem': 'حسب النظام',
  'settings.themeLight': 'فاتح', 'settings.themeDark': 'داكن', 'settings.language': 'اللغة',
  'settings.notifications': 'الإشعارات', 'settings.about': 'حول التطبيق',
  'settings.privacy': 'الخصوصية', 'settings.version': 'الإصدار',

  'pro.title': 'برو', 'pro.unlock': 'يُفتح مع برو', 'pro.monthly': 'شهري',
  'pro.yearly': 'سنوي', 'pro.restore': 'استعادة المشتريات',

  'error.title': 'حدث خطأ ما', 'error.generic': 'لم تتم العملية. أعد المحاولة بعد قليل.',
  'error.network': 'لا يوجد اتصال بالإنترنت.', 'error.timeout': 'انتهت مهلة الطلب.',
  'error.restart': 'إعادة التشغيل',
  'offline.title': 'أنت غير متصل',
  'offline.body': 'تعمل المواقيت والقرآن والمسبحة دون اتصال. وتستأنف المزامنة عند عودة الاتصال.',
  'empty.title': 'لا شيء هنا بعد', 'empty.body': 'سيظهر هنا ما تضيفه.',
  'backup.title': 'نسخة احتياطية',
  'backup.why': 'بياناتك تبقى على هاتفك. أنشئ ملف نسخة احتياطية قبل تغيير الهاتف أو حذف التطبيق.',
  'backup.export': 'إنشاء ملف نسخة احتياطية',
  'backup.exportBody': 'المواقع والعلامات والمفضلة والذكر والفوائت وسجل العبادة والصيام في ملف واحد.',
  'backup.exported': 'النسخة الاحتياطية جاهزة',
  'backup.exportFailed': 'تعذّر إنشاء النسخة الاحتياطية',
  'backup.import': 'الاستعادة من نسخة احتياطية',
  'backup.importBody': 'اختر ملف نسخة احتياطية حفظته سابقًا.',
  'backup.importFailed': 'تعذّرت قراءة النسخة الاحتياطية',
  'backup.errorRead': 'تعذّر فتح الملف.',
  'backup.errorCorrupt': 'يبدو أن الملف تالف.',
  'backup.errorNotBackup': 'هذا ليس ملف نسخة احتياطية لـ {app}.',
  'backup.errorNewer': 'هذه النسخة من إصدار أحدث. حدّث التطبيق أولًا.',
  'backup.restoreTitle': 'كيف تتم الاستعادة؟',
  'backup.fileInfo': '{date} · الإصدار {version}',
  'backup.modeMerge': 'دمج',
  'backup.modeMergeBody': 'لا يُحذف شيء من بياناتك. تُضاف السجلات الموجودة في النسخة فقط، وعند التكرار يبقى الأحدث.',
  'backup.modeReplace': 'الاستبدال بالنسخة الاحتياطية',
  'backup.modeReplaceBody': 'تُستبدل بيانات هذا الجهاز ببيانات النسخة. اختر هذا عند الانتقال إلى هاتف جديد.',
  'backup.restored': 'تمت الاستعادة',
  'backup.restoredMerge': 'أُضيف {count} سجلًا.',
  'backup.restoredReplace': 'حُمِّل كل ما في النسخة الاحتياطية.',
  'backup.countersKept': 'حُفظت عدّادات الفوائت والإعدادات الخاصة بهذا الجهاز.',
};
