import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FirebaseService } from 'src/app/modules/services/firebase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  message: string;
  messageType: string;
  isLoginLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private service: FirebaseService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  showMsg(success: boolean, msg: string) {
    this.message = msg;
    this.messageType = success ? 'success' : 'danger';
    this.changeDetectorRef.detectChanges();
  }
  submit() {
    this.message = '';
    this.messageType = '';
    this.isLoginLoading = true;

    this.authService.SignIn(this.f.email.value, this.f.password.value)
      .then((res: any) => {
        const user = res.user;

        if (!user.emailVerified) {  
          this.authService.SendVerificationMail();
          this.showMsg(false, 'Please verify your email.');
          this.isLoginLoading = false;
          return;
        }

        localStorage.setItem('elev8-club-data', JSON.stringify(user));
        this.ngZone.run(() => {
          this.router.navigate(['/dashboard']);
        });

      }).catch((error) => {
        console.error(error);
        this.showMsg(false, 'Wrong email or password.');
        this.isLoginLoading = false;
      });
  }




}
