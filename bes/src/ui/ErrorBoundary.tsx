/**
 * Küresel hata sınırı — şartname §82, §85.
 *
 * Kural: kullanıcı **hiçbir zaman** beyaz ekran ya da yığın izi görmez.
 * Hata yakalanır, temizlenerek günlüğe yazılır, ekrana ne olduğu ve ne
 * yapabileceği yazılır.
 */
import React from 'react';
import { View } from 'react-native';
import { logger } from '@/lib/log';
import { ErrorState } from './ErrorState';

const log = logger('ui');

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Kullanıcıya gösterilecek metinler — çeviriden gelir, gömülü yazılmaz. */
  title: string;
  description: string;
  retryLabel: string;
  /** Çökme raporlayıcısına iletmek için (§85). */
  onError?: (error: Error, componentStack: string) => void;
}

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // `redact` günlük katmanında uygulanır; buradan ham mesaj geçirilmez.
    log.error('bileşen ağacı çöktü', { error, componentStack: info.componentStack });
    this.props.onError?.(error, info.componentStack ?? '');
  }

  private readonly reset = () => this.setState({ error: null });

  override render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <ErrorState
          title={this.props.title}
          description={this.props.description}
          retryLabel={this.props.retryLabel}
          onRetry={this.reset}
        />
      </View>
    );
  }
}
