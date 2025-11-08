import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent {

  id: string;
  resetForm: FormGroup;
  message: string;
  messageType: string;
  isResetLoading$: Observable<boolean>;

  constructor(private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.resetForm = this.fb.group({
      password: ["", Validators.required]
    });
  }

  get f() {
    return this.resetForm.controls;
  }

  showmessage(success: boolean, message: string) {
    this.message = message;
    this.messageType = success ? 'success' : 'danger';
    this.changeDetectorRef.detectChanges();
  }

  submit() {
    // this.showmessage(false);
    // this.authService
    //   .reset(this.id, this.f.password.value)
    //   .subscribe({
    //     next: (res: any) => this.showmessage(res.status, res.message),
    //     error: (err: any) => this.showmessage(false, err.error.error_text)
    //   });
  }
}
