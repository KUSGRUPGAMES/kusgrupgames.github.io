/**
 * Alt sayfa — seçim listeleri, ayrıntı, Pro tanıtımı. Şartname §8.
 *
 * Klavye davranışı (cihazda bulundu, 1 Ekim): içinde yazı alanı olan
 * sayfalarda (dua isteği, şikâyet, hatim grubu) klavye açılınca "Gönder"
 * düğmesi klavyenin altında kalıyordu ve klavyeyi kapatmanın tek yolu sayfayı
 * kapatmaktı. Şimdi:
 * - sayfa klavyenin üstüne kalkar (KeyboardAvoidingView),
 * - içerik kaydırılabilir; boş yere dokunmak ya da aşağı kaydırmak klavyeyi
 *   kapatır, düğmelere dokunmak ise çalışır (keyboardShouldPersistTaps),
 * - klavye açıkken karartılmış arka plana dokunmak önce klavyeyi kapatır,
 *   yazılanı kaybettirecek şekilde sayfayı kapatmaz.
 */
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView } from 'react-native';
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

  const arkaPlan = () => {
    if (Keyboard.isVisible()) { Keyboard.dismiss(); return; }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          onPress={arkaPlan}
          style={{ flex: 1, backgroundColor: `rgba(0,0,0,${theme.opacity.overlay})` }}
        />
        <Pressable
          // Sayfanın boş bir yerine dokunmak klavyeyi kapatır.
          accessible={false}
          onPress={Keyboard.dismiss}
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
