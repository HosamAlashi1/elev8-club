import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingAuthSessionService } from '../../../../services/auth-session.service';
import { SignupRequest } from '../../../../services/landing-auth-api.service';

type AuthTab = 'login' | 'signup';

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
  serverMsg = '';
  signupSuccessMsg = '';
  showSuccessOverlay = false; // Success animation overlay
  userEmail = ''; // Store user email for success message

  submittedLogin = false;
  submittedSignup = false;

  // Forms
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  // Optional image (signup)
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

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
    private session: LandingAuthSessionService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.startQuoteCarousel();
  }

  ngOnDestroy(): void {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
    }
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
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
    this.displayedQuoteText = '';
    this.displayedAuthorText = '';
    
    const quote = this.currentQuote.text;
    const author = this.currentQuote.author;
    let quoteIndex = 0;
    let authorIndex = 0;

    // Type the quote text
    const typeQuote = () => {
      if (quoteIndex < quote.length) {
        this.displayedQuoteText += quote.charAt(quoteIndex);
        quoteIndex++;
        this.typewriterTimeout = setTimeout(typeQuote, 40); // 40ms per character
      } else {
        // After quote is done, type the author
        this.typewriterTimeout = setTimeout(typeAuthor, 300); // Small pause
      }
    };

    // Type the author text
    const typeAuthor = () => {
      if (authorIndex < author.length) {
        this.displayedAuthorText += author.charAt(authorIndex);
        authorIndex++;
        this.typewriterTimeout = setTimeout(typeAuthor, 50); // 50ms per character
      }
    };

    typeQuote();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      auth_type: [this.defaultAuthType],
      fcm_token: [''],
      device_id: ['']
    });

    this.signupForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(190)]],
      middle_name: ['', [Validators.maxLength(190)]],
      last_name: ['', [Validators.required, Validators.maxLength(190)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
      phone: ['', [Validators.maxLength(30)]],          // اختياري
      auth_type: [this.defaultAuthType],
      file: new FormControl<File | null>(null)          // اختياري
    });
  }

  get lf() { return this.loginForm.controls; }
  get sf() { return this.signupForm.controls; }

  switch(tab: AuthTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.serverMsg = '';
    this.signupSuccessMsg = '';
    this.submittedLogin = false;
    this.submittedSignup = false;
    
    // Reset scroll position when switching tabs
    setTimeout(() => {
      const scrollableElement = document.querySelector('.card-body-scrollable');
      if (scrollableElement) {
        scrollableElement.scrollTop = 0;
      }
    }, 0);
  }

  // ========== LOGIN ==========
  submitLogin() {
    this.submittedLogin = true;
    this.serverMsg = '';
    this.signupSuccessMsg = '';
    if (this.loginForm.invalid) return;

    const { email, password, auth_type, fcm_token, device_id } = this.loginForm.value as any;
    this.isLoading = true;

    this.session.login(email, password, Number(auth_type || 4), fcm_token, device_id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success === true && res?.data?.access_token) {
          this.activeModal.close('authenticated');
        } else {
          this.serverMsg = res?.msg || 'Login failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.serverMsg = err?.error?.msg || 'Something went wrong. Please try again.';
      }
    });
  }

  // ========== SIGNUP ==========
  submitSignup() {
    this.submittedSignup = true;
    this.serverMsg = '';
    this.signupSuccessMsg = '';
    if (this.signupForm.invalid) return;

    const body: SignupRequest = {
      first_name: String(this.sf['first_name'].value || '').trim(),
      middle_name: String(this.sf['middle_name'].value || '').trim(),
      last_name: String(this.sf['last_name'].value || '').trim(),
      email: String(this.sf['email'].value || '').trim(),
      phone: String(this.sf['phone'].value || '').trim(),   // اختياري
      auth_type: Number(this.sf['auth_type'].value || this.defaultAuthType)
    };

    // مَرِن: إذا فيه صورة → نرسل multipart، وإلا JSON
    // تأكد أن LandingAuthSessionService يدعم هذا التصرّف (أرفقت ملاحظة تحت).
    this.isLoading = true;
    this.userEmail = body.email; // Store email for success message
    this.session.signup(body, this.selectedFile || undefined).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success === true) {
          this.signupSuccessMsg = res?.msg || 'Your account has been created successfully. Please check your email.';
          this.showSuccessOverlay = true; // Show success animation
          this.loginForm.patchValue({ email: body.email });
          // Don't switch tab immediately, let user see success message
        } else {
          this.serverMsg = res?.msg || 'Signup failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.serverMsg = err?.error?.msg || 'Something went wrong. Please try again.';
      }
    });
  }

  // Close success overlay and switch to login
  closeSuccessOverlay() {
    this.showSuccessOverlay = false;
    this.switch('login');
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
