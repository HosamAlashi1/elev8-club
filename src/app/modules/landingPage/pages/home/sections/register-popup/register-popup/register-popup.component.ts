import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../../../../../services/firebase.service';
import { GtmService } from '../../../../../../services/gtm.service';
import { Version, Affiliate, Lead } from '../../../../../../../core/models';

interface FormData {
  fullName: string;
  email: string;
  whatsapp: string;
}

@Component({
  selector: 'app-register-popup',
  templateUrl: './register-popup.component.html',
  styleUrls: ['./register-popup.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100px) scale(0.9)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(100px) scale(0.9)' }))
      ])
    ])
  ]
})
export class RegisterPopupComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closePopup = new EventEmitter<void>();

  formData: FormData = {
    fullName: '',
    email: '',
    whatsapp: ''
  };

  // بيانات مقدمات الدول محلياً
  // أسماء الدول بالعربي
  private readonly COUNTRY_NAMES_AR: { [key: string]: string } = {
    "AE": "الإمارات", "SA": "السعودية", "KW": "الكويت", "QA": "قطر",
    "BH": "البحرين", "OM": "عمان", "JO": "الأردن", "LB": "لبنان",
    "EG": "مصر", "SY": "سوريا", "IQ": "العراق", "PS": "فلسطين",
    "LY": "ليبيا", "TN": "تونس", "DZ": "الجزائر", "MA": "المغرب",
    "SD": "السودان", "YE": "اليمن", "US": "أمريكا", "GB": "بريطانيا",
    "FR": "فرنسا", "DE": "ألمانيا", "IT": "إيطاليا", "ES": "إسبانيا",
    "TR": "تركيا", "CN": "الصين", "JP": "اليابان", "IN": "الهند",
    "PK": "باكستان", "BD": "بنغلاديش", "RU": "روسيا", "CA": "كندا",
    "AU": "أستراليا", "NZ": "نيوزيلندا", "BR": "البرازيل", "MX": "المكسيك",
    "AF": "أفغانستان", "AL": "ألبانيا", "AS": "ساموا الأمريكية",
    "AD": "أندورا", "AO": "أنغولا", "AI": "أنغويلا", "AG": "أنتيغوا وبربودا",
    "AR": "الأرجنتين", "AM": "أرمينيا", "AW": "أروبا", "AT": "النمسا",
    "AZ": "أذربيجان", "BS": "الباهاماس", "BB": "بربادوس", "BY": "بيلاروسيا",
    "BE": "بلجيكا", "BZ": "بليز", "BJ": "بنين", "BM": "برمودا",
    "BT": "بوتان", "BO": "بوليفيا", "BA": "البوسنة والهرسك", "BW": "بوتسوانا",
    "BN": "بروناي", "BG": "بلغاريا", "BF": "بوركينا فاسو", "BI": "بوروندي",
    "KH": "كمبوديا", "CM": "الكاميرون", "CV": "الرأس الأخضر", "KY": "جزر كايمان",
    "CF": "جمهورية أفريقيا الوسطى", "TD": "تشاد", "CL": "تشيلي", "CO": "كولومبيا",
    "KM": "جزر القمر", "CG": "الكونغو", "CD": "الكونغو الديمقراطية", "CK": "جزر كوك",
    "CR": "كوستاريكا", "CI": "ساحل العاج", "HR": "كرواتيا", "CU": "كوبا",
    "CW": "كوراساو", "CY": "قبرص", "CZ": "التشيك", "DK": "الدنمارك",
    "DJ": "جيبوتي", "DM": "دومينيكا", "DO": "الدومينيكان", "EC": "الإكوادور",
    "SV": "السلفادور", "GQ": "غينيا الاستوائية", "ER": "إريتريا", "EE": "إستونيا",
    "ET": "إثيوبيا", "FK": "جزر فوكلاند", "FO": "جزر فارو", "FJ": "فيجي",
    "FI": "فنلندا", "GF": "غويانا الفرنسية", "PF": "بولينيزيا الفرنسية", "GA": "الغابون",
    "GM": "غامبيا", "GE": "جورجيا", "GH": "غانا", "GI": "جبل طارق",
    "GR": "اليونان", "GL": "غرينلاند", "GD": "غرينادا", "GP": "غوادلوب",
    "GU": "غوام", "GT": "غواتيمالا", "GG": "غيرنزي", "GN": "غينيا",
    "GW": "غينيا بيساو", "GY": "غيانا", "HT": "هايتي", "HN": "هندوراس",
    "HK": "هونغ كونغ", "HU": "المجر", "IS": "آيسلندا", "ID": "إندونيسيا",
    "IR": "إيران", "IE": "أيرلندا", "IM": "جزيرة مان", "IL": "إسرائيل",
    "JM": "جامايكا", "JE": "جيرسي", "KZ": "كازاخستان", "KE": "كينيا",
    "KI": "كيريباتي", "KP": "كوريا الشمالية", "KR": "كوريا الجنوبية", "KG": "قيرغيزستان",
    "LA": "لاوس", "LV": "لاتفيا", "LS": "ليسوتو", "LR": "ليبيريا",
    "LI": "ليختنشتاين", "LT": "ليتوانيا", "LU": "لوكسمبورغ", "MO": "ماكاو",
    "MK": "مقدونيا", "MG": "مدغشقر", "MW": "ملاوي", "MY": "ماليزيا",
    "MV": "المالديف", "ML": "مالي", "MT": "مالطا", "MH": "جزر مارشال",
    "MQ": "مارتينيك", "MR": "موريتانيا", "MU": "موريشيوس", "YT": "مايوت",
    "FM": "ميكرونيزيا", "MD": "مولدوفا", "MC": "موناكو", "MN": "منغوليا",
    "ME": "الجبل الأسود", "MS": "مونتسرات", "MZ": "موزمبيق", "MM": "ميانمار",
    "NA": "ناميبيا", "NR": "ناورو", "NP": "نيبال", "NL": "هولندا",
    "NC": "كاليدونيا الجديدة", "NI": "نيكاراغوا", "NE": "النيجر", "NG": "نيجيريا",
    "NU": "نيوي", "NF": "جزيرة نورفولك", "MP": "جزر ماريانا", "NO": "النرويج",
    "PW": "بالاو", "PA": "بنما", "PG": "بابوا غينيا الجديدة", "PY": "باراغواي",
    "PE": "بيرو", "PH": "الفلبين", "PN": "جزر بيتكيرن", "PL": "بولندا",
    "PT": "البرتغال", "PR": "بورتوريكو", "RO": "رومانيا", "RW": "رواندا",
    "BL": "سانت بارتيليمي", "SH": "سانت هيلينا", "KN": "سانت كيتس ونيفيس", "LC": "سانت لوسيا",
    "MF": "سانت مارتن", "PM": "سانت بيير وميكلون", "VC": "سانت فنسنت", "WS": "ساموا",
    "SM": "سان مارينو", "ST": "ساو تومي وبرينسيبي", "SN": "السنغال", "RS": "صربيا",
    "SC": "سيشل", "SL": "سيراليون", "SG": "سنغافورة", "SX": "سانت مارتن الهولندية",
    "SK": "سلوفاكيا", "SI": "سلوفينيا", "SB": "جزر سليمان", "SO": "الصومال",
    "ZA": "جنوب أفريقيا", "SS": "جنوب السودان", "LK": "سريلانكا", "SR": "سورينام",
    "SJ": "سفالبارد", "SZ": "إسواتيني", "SE": "السويد", "CH": "سويسرا",
    "TW": "تايوان", "TJ": "طاجيكستان", "TZ": "تنزانيا", "TH": "تايلاند",
    "TL": "تيمور الشرقية", "TG": "توغو", "TK": "توكيلاو", "TO": "تونغا",
    "TT": "ترينيداد وتوباغو", "TM": "تركمانستان", "TC": "جزر تركس وكايكوس", "TV": "توفالو",
    "UG": "أوغندا", "UA": "أوكرانيا", "UY": "أوروغواي", "UZ": "أوزبكستان",
    "VU": "فانواتو", "VA": "الفاتيكان", "VE": "فنزويلا", "VN": "فيتنام",
    "VG": "جزر العذراء البريطانية", "VI": "جزر العذراء الأمريكية", "WF": "واليس وفوتونا",
    "EH": "الصحراء الغربية", "ZM": "زامبيا", "ZW": "زيمبابوي",
    "AX": "جزر آلاند", "BQ": "بونير", "CC": "جزر كوكوس", "CX": "جزيرة كريسماس",
    "IO": "إقليم المحيط الهندي البريطاني", "RE": "ريونيون", "UM": "جزر الولايات المتحدة الصغيرة"
  };

  private readonly COUNTRY_DIAL_CODES: { [key: string]: string } = {
    "BD": "880", "BE": "32", "BF": "226", "BG": "359", "BA": "387", "BB": "+1-246",
    "WF": "681", "BL": "590", "BM": "+1-441", "BN": "673", "BO": "591", "BH": "973",
    "BI": "257", "BJ": "229", "BT": "975", "JM": "+1-876", "BW": "267", "WS": "685",
    "BQ": "599", "BR": "55", "BS": "+1-242", "JE": "+44-1534", "BY": "375", "BZ": "501",
    "RU": "7", "RW": "250", "RS": "381", "TL": "670", "RE": "262", "TM": "993",
    "TJ": "992", "RO": "40", "TK": "690", "GW": "245", "GU": "+1-671", "GT": "502",
    "GR": "30", "GQ": "240", "GP": "590", "JP": "81", "GY": "592", "GG": "+44-1481",
    "GF": "594", "GE": "995", "GD": "+1-473", "GB": "44", "GA": "241", "SV": "503",
    "GN": "224", "GM": "220", "GL": "299", "GI": "350", "GH": "233", "OM": "968",
    "TN": "216", "JO": "962", "HR": "385", "HT": "509", "HU": "36", "HK": "852",
    "HN": "504", "VE": "58", "PR": "+1-787 and 1-939", "PS": "970", "PW": "680",
    "PT": "351", "SJ": "47", "PY": "595", "IQ": "964", "PA": "507", "PF": "689",
    "PG": "675", "PE": "51", "PK": "92", "PH": "63", "PN": "870", "PL": "48",
    "PM": "508", "ZM": "260", "EH": "212", "EE": "372", "EG": "20", "ZA": "27",
    "EC": "593", "IT": "39", "VN": "84", "SB": "677", "ET": "251", "SO": "252",
    "ZW": "263", "SA": "966", "ES": "34", "ER": "291", "ME": "382", "MD": "373",
    "MG": "261", "MF": "590", "MA": "212", "MC": "377", "UZ": "998", "MM": "95",
    "ML": "223", "MO": "853", "MN": "976", "MH": "692", "MK": "389", "MU": "230",
    "MT": "356", "MW": "265", "MV": "960", "MQ": "596", "MP": "+1-670", "MS": "+1-664",
    "MR": "222", "IM": "+44-1624", "UG": "256", "TZ": "255", "MY": "60", "MX": "52",
    "IL": "972", "FR": "33", "IO": "246", "SH": "290", "FI": "358", "FJ": "679",
    "FK": "500", "FM": "691", "FO": "298", "NI": "505", "NL": "31", "NO": "47",
    "NA": "264", "VU": "678", "NC": "687", "NE": "227", "NF": "672", "NG": "234",
    "NZ": "64", "NP": "977", "NR": "674", "NU": "683", "CK": "682", "CI": "225",
    "CH": "41", "CO": "57", "CN": "86", "CM": "237", "CL": "56", "CC": "61",
    "CA": "1", "CG": "242", "CF": "236", "CD": "243", "CZ": "420", "CY": "357",
    "CX": "61", "CR": "506", "CW": "599", "CV": "238", "CU": "53", "SZ": "268",
    "SY": "963", "SX": "599", "KG": "996", "KE": "254", "SS": "211", "SR": "597",
    "KI": "686", "KH": "855", "KN": "+1-869", "KM": "269", "ST": "239", "SK": "421",
    "KR": "82", "SI": "386", "KP": "850", "KW": "965", "SN": "221", "SM": "378",
    "SL": "232", "SC": "248", "KZ": "7", "KY": "+1-345", "SG": "65", "SE": "46",
    "SD": "249", "DO": "+1-809 and 1-829", "DM": "+1-767", "DJ": "253", "DK": "45",
    "VG": "+1-284", "DE": "49", "YE": "967", "DZ": "213", "US": "1", "UY": "598",
    "YT": "262", "UM": "1", "LB": "961", "LC": "+1-758", "LA": "856", "TV": "688",
    "TW": "886", "TT": "+1-868", "TR": "90", "LK": "94", "LI": "423", "LV": "371",
    "TO": "676", "LT": "370", "LU": "352", "LR": "231", "LS": "266", "TH": "66",
    "TG": "228", "TD": "235", "TC": "+1-649", "LY": "218", "VA": "379", "VC": "+1-784",
    "AE": "971", "AD": "376", "AG": "+1-268", "AF": "93", "AI": "+1-264", "VI": "+1-340",
    "IS": "354", "IR": "98", "AM": "374", "AL": "355", "AO": "244", "AS": "+1-684",
    "AR": "54", "AU": "61", "AT": "43", "AW": "297", "IN": "91", "AX": "+358-18",
    "AZ": "994", "IE": "353", "ID": "62", "UA": "380", "QA": "974", "MZ": "258"
  };

  countryCodes: { code: string; country: string; countryAr: string; flag: string }[] = [];
  selectedCountryCode = '+971';
  isDropdownOpen = false;
  searchQuery = '';

  private currentVersion: Version | null = null;
  private currentAffiliate: Affiliate | null = null;
  private affiliateCode: string | null = null;
  isSubmitting = false;
  
  @ViewChild('dropdownTrigger') dropdownTrigger!: ElementRef;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private route: ActivatedRoute,
    private gtm: GtmService
  ) { }

  ngOnInit(): void {
    // تحميل مقدمات الدول محلياً
    this.loadCountryCodes();

    // قراءة ref code من الـ URL أو localStorage
    this.route.queryParams.subscribe(params => {
      this.affiliateCode = params['ref'] || localStorage.getItem('affiliateCode') || null;

      // جلب النسخة الحالية
      this.firebaseService.getCurrentVersion().subscribe(version => {
        this.currentVersion = version;
      });

      // جلب بيانات الأفلييت إذا كان موجود
      if (this.affiliateCode) {
        this.firebaseService.getAffiliateByCode(this.affiliateCode).subscribe(affiliate => {
          this.currentAffiliate = affiliate;
        });
      }
    });
  }

  private loadCountryCodes(): void {
    // تحويل البيانات من JSON object إلى array
    this.countryCodes = Object.entries(this.COUNTRY_DIAL_CODES)
      .filter(([_, dialCode]) => dialCode && dialCode.trim() !== '')
      .map(([countryCode, dialCode]: [string, string]) => {
        // تنظيف المقدمة - إزالة أي نص إضافي والاحتفاظ بالرقم الأول فقط
        let cleanDialCode = dialCode;
        if (dialCode.includes('and')) {
          cleanDialCode = dialCode.split('and')[0].trim();
        }
        if (!cleanDialCode.startsWith('+')) {
          cleanDialCode = '+' + cleanDialCode;
        }

        return {
          code: cleanDialCode,
          country: countryCode,
          countryAr: this.COUNTRY_NAMES_AR[countryCode] || '',
          flag: `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
        };
      });

    // ترتيب الدول العربية أولاً
    const arabCountryCodes = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'EG', 
                               'SY', 'IQ', 'PS', 'LY', 'TN', 'DZ', 'MA', 'SD', 'YE'];

    this.countryCodes.sort((a, b) => {
      const aIsArab = arabCountryCodes.includes(a.country);
      const bIsArab = arabCountryCodes.includes(b.country);

      if (aIsArab && !bIsArab) return -1;
      if (!aIsArab && bIsArab) return 1;

      // ترتيب الدول العربية حسب الترتيب المحدد
      if (aIsArab && bIsArab) {
        return arabCountryCodes.indexOf(a.country) - arabCountryCodes.indexOf(b.country);
      }

      // باقي الدول ترتيب أبجدي
      return a.country.localeCompare(b.country);
    });
  }

  onClose(): void {
    this.closePopup.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  focusNextField(fieldId: string): void {
    setTimeout(() => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.focus();
      }
    }, 0);
  }

  getSelectedCountryFlag(): string {
    const selectedCountry = this.countryCodes.find(c => c.code === this.selectedCountryCode);
    return selectedCountry?.flag || 'https://flagcdn.com/w40/ae.png';
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (!this.isDropdownOpen) {
      this.searchQuery = '';
    }
  }

  selectCountry(code: string): void {
    this.selectedCountryCode = code;
    this.isDropdownOpen = false;
    this.searchQuery = '';
  }

  get filteredCountries() {
    if (!this.searchQuery) {
      return this.countryCodes;
    }
    const query = this.searchQuery.toLowerCase();
    return this.countryCodes.filter(country => 
      country.code.toLowerCase().includes(query) ||
      country.country.toLowerCase().includes(query) ||
      (country.countryAr && country.countryAr.includes(this.searchQuery))
    );
  }

  getDropdownPosition(): { top: number, left: number } {
    if (!this.dropdownTrigger) {
      return { top: 0, left: 0 };
    }
    const rect = this.dropdownTrigger.nativeElement.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left
    };
  }

  // تحويل كود الدولة ISO إلى emoji flag
  getCountryEmoji(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.isSubmitting) return;

    // التحقق من صحة البيانات
    if (!this.formData.fullName || !this.formData.email || !this.formData.whatsapp) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    if (!this.currentVersion) {
      alert('حدث خطأ، الرجاء المحاولة مرة أخرى');
      return;
    }

    this.isSubmitting = true;

    // دمج مقدمة الدولة مع رقم الجوال
    const fullPhoneNumber = this.selectedCountryCode + this.formData.whatsapp;

    // إنشاء كائن Lead
    const leadData: any = {
      versionKey: this.currentVersion.key,
      fullName: this.formData.fullName,
      email: this.formData.email,
      phone: fullPhoneNumber,
      step: 1,
      consent: true,
      createdAt: new Date().toISOString()
    };

    // ضيف affiliateKey فقط لو موجود
    if (this.currentAffiliate?.key) {
      leadData.affiliateKey = this.currentAffiliate.key;
    }

    // ضيف affiliateCode فقط لو موجود
    if (this.affiliateCode) {
      leadData.affiliateCode = this.affiliateCode;
    }

    // حفظ البيانات في Firebase
    this.firebaseService.addLead(leadData)
      .then(leadKey => {

        // Stage 4: Track Lead Submission
        this.gtm.trackLeadSubmission(leadKey, this.affiliateCode || undefined, {
          full_name: this.formData.fullName,
          email: this.formData.email,
          phone: this.formData.whatsapp
        });

        // إغلاق الـ popup
        this.onClose();

        // التوجيه لصفحة الأسئلة مع تمرير leadKey
        this.router.navigate(['/video-questions'], {
          queryParams: {
            lead: leadKey,
            ref: this.affiliateCode || undefined
          }
        });

        // إعادة تعيين النموذج
        this.formData = { fullName: '', email: '', whatsapp: '' };
        this.isSubmitting = false;
      })
      .catch(error => {
        console.error('Error creating lead:', error);
        alert('حدث خطأ أثناء التسجيل، الرجاء المحاولة مرة أخرى');
        this.isSubmitting = false;
      });
  }
}
