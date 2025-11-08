import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingAuthSessionService } from 'src/app/modules/services/auth-session.service';
import { SignupRequest } from 'src/app/modules/services/landing-auth-api.service';
import { ApiPublicService, Country } from 'src/app/modules/services/api.common.service';
import { ToastrsService } from 'src/app/modules/services/toater.service';

type AuthTab = 'login' | 'signup' | 'verification';

interface Quote {
  text: string;
  author: string;
}

@Component({
  selector: 'app-landing-account-modal',
  templateUrl: './landing-account-modal.component.html',
  styleUrls: ['./landing-account-modal.component.css']
})
export class LandingAccountModalComponent implements OnInit, OnDestroy {
  @Input() defaultAuthType: number = 4;
  @Input() initialTab: AuthTab = 'login';

  activeTab: AuthTab = this.initialTab;
  isLoading = false;
  serverMessage = '';
  signupSuccessMessage = '';
  showSuccessOverlay = false; // Success animation overlay
  userEmail = ''; // Store user email for success message

  submittedLogin = false;
  submittedSignup = false;

  // Verification Code
  verificationCode = ['', '', '', ''];
  verificationError = '';
  resendTimer = 0;
  resendInterval: any;
  isVerifying = false;

  // Forms
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  // Optional image (signup)
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

  // Countries list
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  selectedCountry: Country | null = null;
  isLoadingCountries = false;

  // Literary quotes carousel
  quotes: Quote[] = [
    { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
    { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
    { text: 'Between the pages of a book is a lovely place to be.', author: 'Anonymous' },
    { text: 'Reading is dreaming with open eyes.', author: 'Anonymous' },
    { text: 'A room without books is like a body without a soul.', author: 'Cicero' },
    { text: 'There is no friend as loyal as a book.', author: 'Ernest Hemingway' }
  ];
  currentQuoteIndex = 0;
  currentQuote: Quote = this.quotes[0];
  displayedQuoteText = '';
  displayedAuthorText = '';
  private quoteInterval: any;
  private typewriterTimeout: any;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private session: LandingAuthSessionService,
    private apiPublic: ApiPublicService,
    private toaster: ToastrsService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.startQuoteCarousel();
    this.loadCountries();
  }

  ngOnDestroy(): void {
    if (this.quoteInterval) clearInterval(this.quoteInterval);
    if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);
    if (this.resendInterval) clearInterval(this.resendInterval);
  }


  private startQuoteCarousel(): void {
    this.typewriterEffect(); // Start with first quote
    this.quoteInterval = setInterval(() => {
      this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
      this.currentQuote = this.quotes[this.currentQuoteIndex];
      this.typewriterEffect();
    }, 10000); // 10 seconds for quote rotation
  }

  private typewriterEffect(): void {
    // 🔧 أوقف أي تايمر سابق قبل البدء
    if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);

    this.displayedQuoteText = '';
    this.displayedAuthorText = '';

    const quote = this.currentQuote.text;
    const author = this.currentQuote.author;
    let quoteIndex = 0;
    let authorIndex = 0;

    const typeQuote = () => {
      if (quoteIndex < quote.length) {
        this.displayedQuoteText += quote.charAt(quoteIndex);
        quoteIndex++;
        this.typewriterTimeout = setTimeout(typeQuote, 40);
      } else {
        this.typewriterTimeout = setTimeout(typeAuthor, 300);
      }
    };

    const typeAuthor = () => {
      if (authorIndex < author.length) {
        this.displayedAuthorText += author.charAt(authorIndex);
        authorIndex++;
        this.typewriterTimeout = setTimeout(typeAuthor, 50);
      }
    };

    typeQuote();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      auth_type: [this.defaultAuthType],
      fcm_token: [''],
      device_id: ['']
    });

    this.signupForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(190)]],
      last_name: ['', [Validators.required, Validators.maxLength(190)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
      phone: ['', [Validators.maxLength(30)]],          // اختياري
      country_code: [''],                                // اختياري
      password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(190)]],
      password_confirmation: ['', [Validators.required]],
      auth_type: [this.defaultAuthType],
      file: new FormControl<File | null>(null)          // اختياري
    }, { validators: this.passwordMatchValidator });
  }

  // Load countries from API (cached)
  private loadCountries(): void {
    this.isLoadingCountries = true;
    this.apiPublic.getCountries().subscribe({
      next: (res) => {
        if (res?.status === true && res?.data) {
          this.countries = res.data;
          this.filteredCountries = [...this.countries];
          // تعيين القيمة الافتراضية (مثلاً السعودية)
          this.selectedCountry = this.countries.find(c => c.code === '+966') || null;
          if (this.selectedCountry) {
            this.signupForm.patchValue({ country_code: this.selectedCountry.code });
          }
        }
        this.isLoadingCountries = false;
      },
      error: () => {
        this.isLoadingCountries = false;
      }
    });
  }

  onCountryChange(country: Country): void {
    this.selectedCountry = country;
    this.signupForm.patchValue({ country_code: country.code });
  }

  onCountrySearch(event: any): void {
    const query = event.target.value.toLowerCase().trim();
    if (!query) {
      this.filteredCountries = [...this.countries];
    } else {
      this.filteredCountries = this.countries.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.code.toLowerCase().includes(query)
      );
    }
  }

  get lf() { return this.loginForm.controls; }
  get sf() { return this.signupForm.controls; }

  // Custom validator for password match
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('password_confirmation')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  switch(tab: AuthTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.serverMessage = '';
    this.signupSuccessMessage = '';
    this.submittedLogin = false;
    this.submittedSignup = false;

    // Reset verification state when switching away from verification
    if (this.activeTab !== 'verification') {
      this.verificationCode = ['', '', '', ''];
      this.verificationError = '';
      if (this.resendInterval) clearInterval(this.resendInterval);
      this.resendTimer = 0;
    }

    // Reset scroll position when switching tabs
    setTimeout(() => {
      const scrollableElement = document.querySelector('.card-body-scrollable');
      if (scrollableElement) {
        scrollableElement.scrollTop = 0;
      }

      // Auto-focus first digit input on verification tab and clear all inputs
      if (tab === 'verification') {
        // مسح جميع الـ inputs
        this.verificationCode = ['', '', '', ''];
        for (let i = 0; i < 4; i++) {
          const input = document.getElementById(`digit-${i}`) as HTMLInputElement;
          if (input) input.value = '';
        }
        // التركيز على الخانة الأولى
        const firstInput = document.getElementById('digit-0') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }
    }, 100);
  }

  // ========== LOGIN ==========
  submitLogin() {
    this.submittedLogin = true;
    this.serverMessage = '';
    this.signupSuccessMessage = '';
    if (this.loginForm.invalid) return;

    const { email, password, auth_type, fcm_token, device_id } = this.loginForm.value as any;
    this.isLoading = true;

    this.session.login(email, password, Number(auth_type || 4), fcm_token, device_id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // التحقق من status_code = 403 (الحساب غير متحقق)
        if (res?.status_code === 403) {
          // حفظ الإيميل للتحقق
          this.userEmail = email;
          
          // عرض رسالة للمستخدم
          this.toaster.showInfo(
            res?.message || 'Your account is not verified. A new code has been sent to your email.',
            'Verification Required'
          );
          
          // الانتقال لصفحة التحقق
          this.switch('verification');
          
          // إرسال resend code request
          this.sendResendCodeAfterLogin();
        } else if (res?.status === true && res?.data?.access_token) {
          // تسجيل دخول ناجح
          this.activeModal.close('authenticated');
        } else {
          // خطأ آخر
          this.serverMessage = res?.message || 'Login failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.serverMessage = err?.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  // إرسال resend code بعد محاولة login فاشلة بسبب عدم التحقق
  private sendResendCodeAfterLogin() {
    this.session.resendCode(this.userEmail).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          // بدء العداد التنازلي
          this.startResendTimer();
        }
      },
      error: () => {
        // في حالة فشل الـ resend، نبدأ العداد على أي حال
        this.startResendTimer();
      }
    });
  }

  // ========== SIGNUP ==========
  submitSignup() {
    this.submittedSignup = true;
    this.serverMessage = '';
    this.signupSuccessMessage = '';
    if (this.signupForm.invalid) return;

    const body: SignupRequest = {
      first_name: String(this.sf['first_name'].value || '').trim(),
      last_name: String(this.sf['last_name'].value || '').trim(),
      email: String(this.sf['email'].value || '').trim(),
      phone: String(this.sf['phone'].value || '').trim(),   // اختياري
      country_code: String(this.sf['country_code'].value || '').trim(), // اختياري
      password: String(this.sf['password'].value || '').trim(),
      password_confirmation: String(this.sf['password_confirmation'].value || '').trim(),
      auth_type: Number(this.sf['auth_type'].value || this.defaultAuthType)
    };

    this.isLoading = true;
    this.userEmail = body.email; // Store email for verification screen
    this.session.signup(body, this.selectedFile || undefined).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === true) {
          // الانتقال لشاشة التحقق بدلاً من success overlay
          this.switch('verification');
          this.startResendTimer();
        } else {
          this.serverMessage = res?.message || 'Signup failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.serverMessage = err?.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  // Close success overlay and switch to login
  closeSuccessOverlay() {
    this.showSuccessOverlay = false;
    this.switch('login');
  }

  // ========== VERIFICATION CODE ==========
  onDigitInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // فقط الأرقام

    if (value.length > 0) {
      // أخذ أول رقم فقط
      const digit = value[0];
      this.verificationCode[index] = digit;
      input.value = digit;

      // الانتقال للخانة التالية
      if (index < 3) {
        setTimeout(() => {
          const nextInput = document.getElementById(`digit-${index + 1}`) as HTMLInputElement;
          nextInput?.focus();
        }, 50);
      } else {
        // آخر خانة - تحقق من الكود
        if (this.verificationCode.every(d => d !== '')) {
          setTimeout(() => this.submitVerification(), 300);
        }
      }
    } else {
      // تم مسح القيمة
      this.verificationCode[index] = '';
      input.value = '';
    }
    
    this.verificationError = '';
  }

  onDigitKeydown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace') {
      event.preventDefault();
      
      if (this.verificationCode[index]) {
        // مسح الخانة الحالية
        this.verificationCode[index] = '';
        input.value = '';
      } else if (index > 0) {
        // الانتقال للخانة السابقة
        const prevInput = document.getElementById(`digit-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          this.verificationCode[index - 1] = '';
          prevInput.value = '';
          prevInput.focus();
        }
      }
      this.verificationError = '';
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      document.getElementById(`digit-${index - 1}`)?.focus();
    } else if (event.key === 'ArrowRight' && index < 3) {
      event.preventDefault();
      document.getElementById(`digit-${index + 1}`)?.focus();
    } else if (event.key.length === 1 && !/^\d$/.test(event.key)) {
      // منع أي حرف غير رقمي
      event.preventDefault();
    }
  }

  onDigitPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 4);

    if (digits.length === 0) return;

    // ملء الخانات
    for (let i = 0; i < 4; i++) {
      if (i < digits.length) {
        this.verificationCode[i] = digits[i];
        const input = document.getElementById(`digit-${i}`) as HTMLInputElement;
        if (input) input.value = digits[i];
      }
    }

    // التركيز على الخانة المناسبة
    if (digits.length === 4) {
      // إذا تم لصق 4 أرقام، أرسل الكود
      setTimeout(() => this.submitVerification(), 300);
    } else {
      // التركيز على الخانة التالية الفارغة
      const nextIndex = Math.min(digits.length, 3);
      document.getElementById(`digit-${nextIndex}`)?.focus();
    }
  }

  submitVerification() {
    const code = this.verificationCode.join('');
    if (code.length !== 4) {
      this.verificationError = 'Please enter the 4-digit code';
      return;
    }

    this.isVerifying = true;
    this.verificationError = '';

    this.session.confirmCode(this.userEmail, code).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        if (res?.status === true) {
          // نجحت عملية التحقق، الانتقال للـ login
          // this.toaster.showSuccess('Your email has been verified successfully!', 'Verification Complete');
          this.signupSuccessMessage = 'Account verified successfully! Please sign in.';
          this.loginForm.patchValue({ email: this.userEmail });
          this.switch('login');
        } else {
          this.verificationError = res?.message || 'Invalid verification code';
          this.toaster.showError(this.verificationError, 'Verification Failed');
        }
      },
      error: (err: any) => {
        this.isVerifying = false;
        this.verificationError = err?.error?.message || 'Verification failed. Please try again.';
        this.toaster.showError(this.verificationError, 'Error');
      }
    });
  }

  resendVerificationCode() {
    if (this.resendTimer > 0) return;

    this.isLoading = true;
    this.verificationError = '';

    this.session.resendCode(this.userEmail).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === true) {
          this.startResendTimer();
          this.toaster.showSuccess('Verification code has been resent to your email', 'Code Sent!');
        } else {
          this.verificationError = res?.message || 'Failed to resend code';
          this.toaster.showError(this.verificationError, 'Resend Failed');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.verificationError = err?.error?.message || 'Failed to resend code';
        this.toaster.showError(this.verificationError, 'Error');
      }
    });
  }

  private startResendTimer() {
    this.resendTimer = 60;
    if (this.resendInterval) clearInterval(this.resendInterval);

    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  // ========== Image handlers (optional) ==========
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragOver = false;
    const file = e.dataTransfer?.files?.[0]; if (file) this.handleFile(file);
  }
  onFileChange(event: any) {
    const file = event?.target?.files?.[0]; if (file) this.handleFile(file);
  }
  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.signupForm.patchValue({ file: null });
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.signupForm.patchValue({ file });
    const reader = new FileReader();
    reader.onload = (e: any) => this.imagePreview = e.target.result;
    reader.readAsDataURL(file);
  }
}
