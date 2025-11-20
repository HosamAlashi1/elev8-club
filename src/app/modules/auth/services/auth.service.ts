import { Injectable, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AngularFireAuth } from "@angular/fire/compat/auth";

@Injectable({
  providedIn: "root",
})
export class AuthService {

  userData: any;

  constructor(public afAuth: AngularFireAuth, public router: Router,
    public ngZone: NgZone, public toster: ToastrService) {
  }

  //sign in function
  SignIn(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  //singup function
  SignUp(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        this.SendVerificationMail();
        this.toster.success("Added successfully .. please verify your email.");
      }).catch((error: any) => {
        this.toster.error(error.message);
      })
  }

  ForgotPassword(passwordResetEmail: string) {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        this.toster.success("Password reset email sent, check your inbox.");
      })
      .catch((error: any) => {
        this.toster.error(error.message);
      });
  }

  SendVerificationMail() {
    this.afAuth.currentUser.then((user) => {
      if (user) {
        return user.sendEmailVerification();
      }
    });
  }

  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('elev8-club-data');
      this.router.navigate(["/auth/login"]);
    })
  }
}