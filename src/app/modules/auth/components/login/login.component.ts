import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FirebaseService } from 'src/app/modules/services/firebase.service';
import { DashboardUser } from 'src/app/core/models';

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
  showPassword = false;

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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  submit() {
    this.message = '';
    this.messageType = '';
    this.isLoginLoading = true;

    this.authService.SignIn(this.f.email.value, this.f.password.value)
      .then(async (res: any) => {
        const user = res.user;

        // Finish restoring/minting the Firebase session before dashboard navigation.
        await user.getIdToken(true);

        if (!user.emailVerified) {
          this.authService.SendVerificationMail();
          this.showMsg(false, 'Please verify your email.');
          this.isLoginLoading = false;
          return;
        }

        // Fetch dashboard user profile (role, etc.)
        let dashUser: DashboardUser | null = null;
        try {
          dashUser = (await this.service.getDashboardUser(user.uid).toPromise()) ?? null;
        } catch (e) {}

        if (!dashUser) {
          await this.authService.SignOut();
          this.showMsg(false, 'Dashboard access is not configured for this account.');
          this.isLoginLoading = false;
          return;
        }

        // Block inactive users
        if (!dashUser.isActive) {
          await this.authService.SignOut();
          this.showMsg(false, 'Your account is inactive. Please contact an administrator.');
          this.isLoginLoading = false;
          return;
        }

        const sessionData = {
          uid: user.uid,
          email: user.email,
          role: dashUser.role,
          name: dashUser.name || user.displayName || '',
          salesMemberKey: dashUser.salesMemberKey || null,
          affiliateKey: dashUser.affiliateKey || null,
        };

        localStorage.setItem('elev8-club-data', JSON.stringify(sessionData));

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
