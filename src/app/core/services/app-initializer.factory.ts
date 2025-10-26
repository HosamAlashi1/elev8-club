import { AppInitializerService } from './app-initializer.service';

/**
 * دالة مصنع لـ APP_INITIALIZER
 * هذه الدالة ستعمل قبل بدء التطبيق وتضمن تحميل البيانات الأساسية
 */
export function appInitializerFactory(appInitializer: AppInitializerService) {
  return () => {
    // console.log('🔧 Factory: Creating APP_INITIALIZER function');
    return appInitializer.initialize();
  };
}
