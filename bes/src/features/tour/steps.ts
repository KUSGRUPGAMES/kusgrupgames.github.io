/** Sekme tanıtımı adımları — metinler çeviriden (tour.*). */
import type { StringKey } from '@/lib/i18n/strings/tr';

export type TourTab = 'index' | 'quran' | 'worship' | 'community' | 'profile';

export interface TourStep { icon: string; title: StringKey; body: StringKey }

const s = (icon: string, k: string): TourStep => ({ icon, title: `tour.${k}.title` as StringKey, body: `tour.${k}.body` as StringKey });

export const TOUR_STEPS: Record<TourTab, readonly TourStep[]> = {
  index: [
    s('clock', 'home1'), s('location', 'home2'), s('compass', 'home3'), s('bell', 'home4'),
  ],
  quran: [
    s('book', 'quran1'), s('sparkle', 'quran2'), s('play', 'quran3'), s('bookmark', 'quran4'),
  ],
  worship: [
    s('beads', 'worship1'), s('calendar', 'worship2'), s('chart', 'worship3'), s('mosque', 'worship4'),
  ],
  community: [
    s('heart', 'community1'), s('message', 'community2'), s('users', 'community3'), s('lock', 'community4'),
  ],
  profile: [
    s('clock', 'profile1'), s('user', 'profile2'), s('star', 'profile3'),
  ],
};
