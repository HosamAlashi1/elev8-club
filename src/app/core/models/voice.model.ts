/**
 * Voice Model
 * نموذج موحد للأصوات المستخدمة في المشروع
 */

export interface Voice {
  /** المفتاح الفريد للصوت (مثل: en-US-AIGenerate1Neural) */
  key: string;

  /** الاسم المعروض (مثل: AIGenerate1 (Male, English (US))) */
  name: string;

  /** الجنس: ذكر، أنثى، أو محايد */
  gender: 'Male' | 'Female' | 'Neutral';

  /** رابط العينة الصوتية (MP3) */
  sample: string;

  /** رابط صورة الأفاتار (مؤقتاً placeholder، مستقبلاً من الـ API) */
  image: string;
}

/**
 * Response من API /common/voices
 */
export interface VoicesApiResponse {
  success: boolean;
  msg: string;
  data: Array<{
    key: string;
    gender: 'Male' | 'Female' | 'Neutral';
    name: string;
    sample: string;
    // مستقبلاً قد يُضاف:
    image?: string;
  }>;
}
