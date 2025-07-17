import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { HttpService } from '../../services/http.service';
import { ToastrsService } from '../../services/toater.service';
import { PublicService } from '../../services/public.service';
import { LottieOverlayService } from '../../services/LottieOverlayService.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  selectedUsers: number[] = [];

  // Pagination & search
  isLoading$ = new BehaviorSubject<boolean>(true);
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  page = 1;
  size = 10;
  totalCount = 0;

  loading = false;
  status: '' | 'success' | 'error' = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private http: HttpService,
    private toastr: ToastrsService,
    private publicService: PublicService,
    private lottieService: LottieOverlayService
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  initForm() {
    this.form = this.fb.group({
      type: ['all', Validators.required],
      title: ['', Validators.required],
      body: ['', Validators.required]
    });
  }

  // Search logic
  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  loadUsers(): void {
    this.list(this.page);
  }

  list(page: number): void {
  this.page = page;
  this.isLoading$.next(true);

  // بيانات ستاتيك لتجربة الشكل
  const dummyUsers = [
    { id: 1, name: 'Ali Hasan', email: 'ali@example.com', image: 'assets/img/blank.png' },
    { id: 2, name: 'Sara Khaled', email: 'sara@example.com', image: 'assets/img/blank.png' },
    { id: 3, name: 'Mohammed Zayed', email: 'mzayed@example.com', image: 'assets/img/blank.png' },
    { id: 4, name: 'Lina Ameen', email: 'lina@example.com', image: 'assets/img/blank.png' },
    { id: 5, name: 'Osama Noor', email: 'osama@example.com', image: 'assets/img/blank.png' },
    { id: 6, name: 'Maya Alami', email: 'maya@example.com', image: 'assets/img/blank.png' },
    { id: 7, name: 'Yousef Al-Fayez', email: 'yousef@example.com', image: 'assets/img/blank.png' },
    { id: 8, name: 'Hana Adel', email: 'hana@example.com', image: 'assets/img/blank.png' },
    { id: 9, name: 'Tariq Ahmad', email: 'tariq@example.com', image: 'assets/img/blank.png' },
    { id: 10, name: 'Rania Said', email: 'rania@example.com', image: 'assets/img/blank.png' },
    { id: 11, name: 'Khalid Fathi', email: 'khalid@example.com', image: 'assets/img/blank.png' },
    { id: 12, name: 'Nour El Din', email: 'nour@example.com', image: 'assets/img/blank.png' }
  ];

  // تطبيق البحث
  const filtered = dummyUsers.filter(u =>
    u.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
    u.email.toLowerCase().includes(this.searchText.toLowerCase())
  );

  // محاكاة تقطيع الصفحات (pagination)
  const start = (this.page - 1) * this.size;
  const end = start + this.size;
  const paginated = filtered.slice(start, end);

  // حفظ النتائج
  this.users = paginated.map(u => ({ ...u, checked: false }));
  this.totalCount = filtered.length;

  // إنهاء اللودر
  setTimeout(() => this.isLoading$.next(false), 500);
}


  toggleAll(event: any): void {
    const checked = event.target.checked;
    this.users.forEach(user => user.checked = checked);
  }

  sendNotification(): void {
    if (this.form.invalid) return;

    const type = this.form.value.type;
    const title = this.form.value.title;
    const body = this.form.value.body;

    const selectedUserIds = this.users.filter(u => u.checked).map(u => u.id);

    const payload = {
      type,
      title,
      body,
      users: type === 'specific' ? selectedUserIds : []
    };

    this.loading = true;
    this.status = '';

    // محاكاة API call
    setTimeout(() => {
      const success = Math.random() > 0.2;
      this.loading = false;

      this.lottieService.show({
        options: {
          path: success
            ? 'assets/json/send_successfully.json'
            : 'assets/json/fatel_error.json'
        },
        message: success
          ? 'Notification sent successfully'
          : 'Notification failed to send',
        messageClass: success ? 'text-dark' : 'text-danger',
        autoCloseDelay: 2000,
        visible: false
      });

      if (success) {
        this.form.reset({ type: 'all' });
        this.users.forEach(u => u.checked = false);
        this.status = 'success';
      } else {
        this.status = 'error';
      }
    }, 2500);
  }

  openImageModal(image: string) {
    this.publicService.openImage('User Image', image);
  }
  
}
