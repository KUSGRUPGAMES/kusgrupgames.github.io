/**
 * Bileşen sınamaları — şartname §86.
 *
 * Amaç: tasarım sisteminin sözleşmesini korumak. Bir bileşen erişilebilirlik
 * bilgisini ya da tema rengini bıraktığında burada yakalanır — kaynak kodu
 * tarayan denetimlerin göremediği şey, bileşenin **gerçekten ne çizdiğidir**.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { I18nProvider } from '@/lib/i18n';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { Text } from '@/ui/Text';
import { ProgressBar } from '@/ui/ProgressBar';
import { Chip } from '@/ui/Chip';
import { Segmented } from '@/ui/Segmented';
import { ErrorState } from '@/ui/ErrorState';
import { EmptyState } from '@/ui/EmptyState';
import { ProLock } from '@/ui/ProLock';
import { ArabicText } from '@/ui/ArabicText';
import { Stepper } from '@/ui/Stepper';

function Kabuk({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider initialMode="light">
      <I18nProvider initialLanguage="tr">{children}</I18nProvider>
    </ThemeProvider>
  );
}

/**
 * RTL 14'te `render` **promise döndürür**; beklenmezse sorgular boş bir
 * nesneden okunur ve "render function has not been called" hatası alınır.
 * `screen` yerine dönen sorguların kullanılması da bilinçli: jest-expo
 * ortamında global `screen` ayrı bir modül örneğine bağlanıyor.
 */
const ciz = (ui: React.ReactElement) => render(<Kabuk>{ui}</Kabuk>);

describe('Button', () => {
  it('etiketi gösterir ve dokunmayı iletir', async () => {
    const fn = jest.fn();
    const ekran = await ciz(<Button label="Kaydet" onPress={fn} />);
    fireEvent.press(ekran.getByRole('button', { name: 'Kaydet' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('devre dışıyken dokunma iletilmez ve durum bildirilir', async () => {
    const fn = jest.fn();
    const ekran = await ciz(<Button label="Kapalı" onPress={fn} disabled />);
    const dugme = ekran.getByRole('button', { name: 'Kapalı' });
    fireEvent.press(dugme);
    expect(fn).not.toHaveBeenCalled();
    expect(dugme.props.accessibilityState.disabled).toBe(true);
  });

  it('yüklenirken meşgul olarak bildirilir', async () => {
    const ekran = await ciz(<Button label="Gönder" onPress={() => undefined} loading />);
    expect(ekran.getByRole('button', { name: 'Gönder' }).props.accessibilityState.busy).toBe(true);
  });
});

describe('IconButton', () => {
  it('etiketiyle bulunur', async () => {
    const fn = jest.fn();
    const ekran = await ciz(<IconButton name="close" label="Kapat" onPress={fn} />);
    fireEvent.press(ekran.getByLabelText('Kapat'));
    expect(fn).toHaveBeenCalled();
  });
});

describe('Text', () => {
  it('Dynamic Type çarpanını sınırlar', async () => {
    const ekran = await ciz(<Text>Merhaba</Text>);
    expect(ekran.getByText('Merhaba').props.maxFontSizeMultiplier).toBeLessThanOrEqual(1.8);
  });

  it('satır kırpma iletilir', async () => {
    const ekran = await ciz(<Text lines={2}>Uzun metin</Text>);
    expect(ekran.getByText('Uzun metin').props.numberOfLines).toBe(2);
  });
});

describe('ArabicText', () => {
  it('sağdan sola akar ve sistem ölçeğini kapatır', async () => {
    const ekran = await ciz(<ArabicText>{'بسم'}</ArabicText>);
    const el = ekran.getByText('بسم');
    const stil = Array.isArray(el.props.style) ? Object.assign({}, ...el.props.style.filter(Boolean)) : el.props.style;
    expect(stil.writingDirection).toBe('rtl');
    expect(stil.textAlign).toBe('right');
    expect(el.props.allowFontScaling).toBe(false);
  });

  it('kullanıcı ölçeği sınırlar içinde tutulur', async () => {
    const ekran = await ciz(<ArabicText scale={9}>{'ب'}</ArabicText>);
    const el = ekran.getByText('ب');
    const stil = Array.isArray(el.props.style) ? Object.assign({}, ...el.props.style.filter(Boolean)) : el.props.style;
    // Ölçek 2.0 ile sınırlı: 30 * 2 = 60.
    expect(stil.fontSize).toBeLessThanOrEqual(60);
  });
});

describe('ProgressBar', () => {
  it('değeri ekran okuyucuya bildirir ve sınırların dışına taşmaz', async () => {
    const ekran = await ciz(<ProgressBar value={2} accessibilityLabel="ilerleme" />);
    expect(ekran.getByLabelText('ilerleme').props.accessibilityValue.now).toBe(100);
  });

  it('geçersiz değer sıfır sayılır', async () => {
    const ekran = await ciz(<ProgressBar value={Number.NaN} accessibilityLabel="ilerleme" />);
    expect(ekran.getByLabelText('ilerleme').props.accessibilityValue.now).toBe(0);
  });
});

describe('Chip ve Segmented', () => {
  it('Chip seçili durumunu bildirir', async () => {
    const ekran = await ciz(<Chip label="Sabah" selected onPress={() => undefined} />);
    expect(ekran.getByLabelText('Sabah').props.accessibilityState.selected).toBe(true);
  });

  it('Segmented seçimi değiştirir', async () => {
    const fn = jest.fn();
    const ekran = await ciz(
      <Segmented
        options={[{ value: 'a', label: 'Bir' }, { value: 'b', label: 'İki' }]}
        value="a"
        onChange={fn}
        accessibilityLabel="seçim"
      />,
    );
    fireEvent.press(ekran.getByLabelText('İki'));
    expect(fn).toHaveBeenCalledWith('b');
  });
});

describe('durum ekranları', () => {
  it('hata durumu alarm olarak duyurulur ve yeniden denenebilir', async () => {
    const fn = jest.fn();
    const ekran = await ciz(<ErrorState description="Bağlantı yok" retryLabel="Tekrar" onRetry={fn} />);
    expect(ekran.getByRole('alert')).toBeTruthy();
    fireEvent.press(ekran.getByRole('button', { name: 'Tekrar' }));
    expect(fn).toHaveBeenCalled();
  });

  it('boş durum başlık ve açıklama gösterir', async () => {
    const ekran = await ciz(<EmptyState title="Boş" description="Henüz yok" />);
    expect(ekran.getByText('Boş')).toBeTruthy();
    expect(ekran.getByText('Henüz yok')).toBeTruthy();
  });
});

describe('ProLock', () => {
  it('kilitliyken içerik görünür ama dokunma Pro çağrısına gider', async () => {
    const fn = jest.fn();
    const ekran = await ciz(<ProLock locked onPress={fn} label="Pro ile açılır"><Text>Gizli</Text></ProLock>);
    fireEvent.press(ekran.getByLabelText('Pro ile açılır'));
    expect(fn).toHaveBeenCalled();
    // İçerik kaldırılmaz, soluklaştırılır: kullanıcı ne aldığını görür.
    expect(ekran.getByText('Gizli')).toBeTruthy();
  });

  it('kilitli değilken sarmalayıcı eklemez', async () => {
    const ekran = await ciz(<ProLock locked={false} onPress={() => undefined}><Text>Açık</Text></ProLock>);
    expect(ekran.queryByLabelText('Pro ile açılır')).toBeNull();
    expect(ekran.getByText('Açık')).toBeTruthy();
  });
});

describe('Stepper', () => {
  // Hatırlatıcı saati "+21" diye çiziliyordu: artı işareti her pozitif
  // değere konuyordu. İşaret yalnız düzeltme alanlarında anlamlıdır.
  it('mutlak değerde artı işareti koymuyor', async () => {
    const r = await ciz(
      <Stepper title="Saat" value={21} min={0} max={23} onChange={() => {}} />,
    );
    expect(r.queryByText('+21')).toBeNull();
    expect(r.getByText('21')).toBeTruthy();
  });

  it('düzeltme alanında artı işareti koyuyor', async () => {
    const r = await ciz(
      <Stepper title="Dakika düzeltmesi" value={5} min={-60} max={60} unit="dk" signed onChange={() => {}} />,
    );
    expect(r.getByText('+5 dk')).toBeTruthy();
  });
});
