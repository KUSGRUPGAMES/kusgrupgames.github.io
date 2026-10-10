/**
 * Uygulama girişi — normalde `expo-router/entry` doğrudan `package.json`
 * `main` alanında olurdu. Android widget'ları için ayrıca bir headless JS
 * görevi (`registerWidgetTaskHandler`) kaydetmek gerekiyor; bu görev OS
 * tarafından (uygulama kapalıyken de) tetiklenir ve kendi başına çalışır,
 * bu yüzden normal React ağacının/sağlayıcılarının dışında, burada.
 */
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { loadAndroidWidgetPayload } from '@/features/widget/android/store';
import { VakitWidget, GununWidget } from '@/features/widget/android/render';

registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') return;
  const payload = await loadAndroidWidgetPayload();
  const nowSec = Date.now() / 1000;
  if (widgetInfo.widgetName === 'GununWidget') {
    renderWidget(<GununWidget payload={payload} />);
    return;
  }
  renderWidget(<VakitWidget payload={payload} nowSec={nowSec} />);
});
