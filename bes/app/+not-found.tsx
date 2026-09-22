/** Bilinmeyen yol — şartname §92: hiçbir ekran boş bırakılmaz. */
import React from 'react';
import { router } from 'expo-router';
import { Screen, EmptyState } from '@/ui';
import { useT } from '@/lib/i18n';

export default function NotFoundScreen() {
  const t = useT();
  return (
    <Screen>
      <EmptyState
        icon="search"
        title={t('error.notFound')}
        description={t('empty.body')}
        actionLabel={t('nav.home')}
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
