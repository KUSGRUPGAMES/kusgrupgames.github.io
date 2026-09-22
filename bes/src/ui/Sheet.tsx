/** Alt sayfa — seçim listeleri, ayrıntı, Pro tanıtımı. Şartname §8. */
import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { Row } from './Stack';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: `rgba(0,0,0,${theme.opacity.overlay})` }}
      />
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.radius.xxl,
          borderTopRightRadius: theme.radius.xxl,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          maxHeight: '85%',
        }}
      >
        <Row align="center" gap="md" style={{ paddingTop: theme.spacing.sm }}>
          <Text variant="title3" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
          <IconButton name="close" label="Kapat" onPress={onClose} />
        </Row>
        {children}
      </View>
    </Modal>
  );
}
