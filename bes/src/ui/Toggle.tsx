/** Anahtar satırı — bildirim açma/kapama gibi ayarlar. Şartname §8. */
import React from 'react';
import { Switch } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ListItem } from './ListItem';
import type { IconName } from './Icon';

export interface ToggleProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: IconName;
  disabled?: boolean;
}

export function Toggle({ title, subtitle, value, onChange, icon, disabled = false }: ToggleProps) {
  const theme = useTheme();
  return (
    <ListItem
      title={title}
      {...(subtitle ? { subtitle } : {})}
      {...(icon ? { icon } : {})}
      chevron={false}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          accessibilityLabel={title}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          thumbColor={theme.colors.surface}
        />
      }
    />
  );
}
