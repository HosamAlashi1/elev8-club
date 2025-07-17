import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.component.html',
  styleUrls: ['./forget.component.css']
})
export class ForgetComponent {

  forgetForm: FormGroup;
  message: string;
  messageType: string;
  isForgetLoading$: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.forgetForm = this.fb.group({
      username: ["", Validators.required]
    });
  }

  get f() {
    return this.forgetForm.controls;
  }

  showMsg(success: boolean, msg: string) {
    this.message = msg;
    this.messageType = success ? 'success' : 'danger';
    this.changeDetectorRef.detectChanges();
  }

  submit() {
    // this.showMsg(false);
    // this.authService
    //   .forget(this.f.username.value)
    //   .subscribe({
    //     next: (res: any) => this.showMsg(res.success, res.msg),
    //     error: (err: any) => this.showMsg(false, err.error.error_text)
    //   });
  }
}
