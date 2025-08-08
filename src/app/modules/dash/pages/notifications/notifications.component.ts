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
    const payload = {
      perPage: this.size,
      page: this.page,
      search: this.searchText.trim()
    };

    const url = `${this.api.user.list}`;
    this.http.list(url, payload, 'usersList').subscribe({
      next: (res) => {
        console.log('Users API Response:', res); // Debug log
        
        if (res?.status && res?.items?.data) {
          this.users = res.items.data.map((u: any) => ({
            ...u,
            id: u.id,
            name: u.name || 'N/A',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A',
            image: u.photo || 'assets/img/blank.png',
            checked: false
          }));
          this.totalCount = res.items.total_records;
        } else {
          this.users = [];
          this.totalCount = 0;
        }
        this.isLoading$.next(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.toastr.Showerror('Failed to load users');
        this.users = [];
        this.totalCount = 0;
        this.isLoading$.next(false);
      }
    });
  }


  toggleAll(event: any): void {
    const checked = event.target.checked;
    this.users.forEach(user => user.checked = checked);
  }

  // Get count of selected users
  getSelectedUsersCount(): number {
    return this.users.filter(u => u.checked).length;
  }

  // Check if form is valid for submission
  isFormValidForSubmission(): boolean {
    if (this.form.invalid) return false;
    
    const type = this.form.value.type;
    if (type === 'specific') {
      return this.getSelectedUsersCount() > 0;
    }
    
    return true;
  }

  sendNotification(): void {
    if (this.form.invalid) return;

    const type = this.form.value.type;
    const title = this.form.value.title;
    const body = this.form.value.body;

    // Get selected users when type is 'specific'
    const selectedUserIds = type === 'specific' 
      ? this.users.filter(u => u.checked).map(u => u.id)
      : [];

    // Validate specific user selection
    if (type === 'specific' && selectedUserIds.length === 0) {
      this.toastr.Showerror('Please select at least one user for specific notification');
      return;
    }

    const payload = {
      type,
      title,
      body,
      users: selectedUserIds
    };

    this.loading = true;
    this.status = '';

    // Use actual API endpoint for sending notifications
    const url = this.api.notifications.send;
    
    this.http.action(url, payload, 'sendNotification').subscribe({
      next: (res: any) => {
        this.loading = false;
        
        if (res?.status) {
          this.lottieService.show({
            options: {
              path: 'assets/json/send_successfully.json'
            },
            message: 'Notification sent successfully',
            messageClass: 'text-dark',
            autoCloseDelay: 2000,
            visible: false
          });

          // Reset form and selections
          this.form.reset({ type: 'all' });
          this.users.forEach(u => u.checked = false);
          this.status = 'success';
          
          // this.toastr.Showsuccess('Notification sent successfully');
        } else {
          this.handleNotificationError(res?.message || 'Failed to send notification');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Notification send error:', error);
        this.handleNotificationError('Failed to send notification');
      }
    });
  }

  private handleNotificationError(message: string): void {
    this.lottieService.show({
      options: {
        path: 'assets/json/fatel_error.json'
      },
      message: message,
      messageClass: 'text-danger',
      autoCloseDelay: 2000,
      visible: false
    });

    this.status = 'error';
    // this.toastr.Showerror(message);
  }

  openImageModal(image: string) {
    this.publicService.openImage('User Image', image);
  }
  
}
