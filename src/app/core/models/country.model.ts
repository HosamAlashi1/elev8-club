/**
 * Country Model
 * يحتوي على معلومات الدول وأكواد الاتصال
 */
export interface Country {
  id: number;
  name: string;
  code: string; // مثال: +966, +1, +20
}

/**
 * Countries API Response
 */
export interface CountriesApiResponse {
  status: boolean;
  status_code: number;
  message: string;
  data: Country[];
}
