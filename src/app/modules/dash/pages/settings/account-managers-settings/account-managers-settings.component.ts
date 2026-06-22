import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, of, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { ToastrsService } from '../../../../services/toater.service';
import { DashboardUser } from '../../../../../core/models';
import { Affiliate } from '../../../../../core/models';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-account-managers-settings',
  templateUrl: './account-managers-settings.component.html',
  styleUrls: ['./account-managers-settings.component.css']
})
export class AccountManagersSettingsComponent implements OnInit, OnDestroy {
  managers: DashboardUser[] = [];
  affiliates: Affiliate[] = [];
  isLoading = true;
  isSaving = false;
  isEditing = false;
  showAddForm = false;
  addForm!: FormGroup;
  editForm!: FormGroup;
  editingManager: DashboardUser | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastr: ToastrsService,
    private afAuth: AngularFireAuth
  ) {}

  currentVersionKey = '';

  ngOnInit(): void {
    this.buildAddForm();
    this.firebaseService.getCurrentVersion().pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.currentVersionKey = v?.key || '';
      this.loadAffiliates();
    });
    this.loadManagers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildAddForm(): void {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      affiliateKey: ['', Validators.required],
      isActive: [true]
    });
  }

  private buildEditForm(manager: DashboardUser): void {
    this.editForm = this.fb.group({
      name: [manager.name, Validators.required],
      affiliateKey: [manager.affiliateKey || '', Validators.required],
      isActive: [manager.isActive]
    });
  }

  loadAffiliates(): void {
    if (!this.currentVersionKey) return;
    this.firebaseService.getAffiliatesByVersion(this.currentVersionKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe(affiliates => {
        this.affiliates = affiliates;
      });
  }

  onAffiliateChange(event: Event): void {
    const key = (event.target as HTMLSelectElement).value;
    const affiliate = this.affiliates.find(a => a.key === key);
    if (affiliate) {
      this.addForm.patchValue({
        name: affiliate.name,
        email: affiliate.email
      });
    }
  }

  loadManagers(): void {
    this.firebaseService.getAllDashboardUsers().pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.managers = users.filter(u => u.role === 'account_manager');
      this.isLoading = false;
    });
  }

  getAffiliateName(affiliateKey: string): string {
    const affiliate = this.affiliates.find(a => a.key === affiliateKey);
    return affiliate ? affiliate.name : affiliateKey;
  }

  getAffiliateCode(affiliateKey: string): string {
    const affiliate = this.affiliates.find(a => a.key === affiliateKey);
    return affiliate ? affiliate.code : '';
  }

  toggleActive(manager: DashboardUser): void {
    if (!manager.uid) return;
    const newStatus = !manager.isActive;
    this.firebaseService.updateDashboardUser(manager.uid, { isActive: newStatus })
      .then(() => {
        manager.isActive = newStatus;
        this.toastr.showSuccess(`Account manager ${newStatus ? 'activated' : 'deactivated'}`);
      })
      .catch(() => this.toastr.showError('Failed to update status'));
  }

  delete(manager: DashboardUser): void {
    if (!manager.uid || !confirm(`Delete account for ${manager.name}? This cannot be undone.`)) return;
    this.firebaseService.updateDashboardUser(manager.uid, { role: 'deleted' as any, isActive: false })
      .then(() => this.toastr.showSuccess('Account manager removed'))
      .catch(() => this.toastr.showError('Failed to delete'));
  }

  toggleForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) this.buildAddForm();
    this.cancelEdit();
  }

  startEdit(manager: DashboardUser): void {
    this.editingManager = manager;
    this.buildEditForm(manager);
    this.showAddForm = false;
  }

  cancelEdit(): void {
    this.editingManager = null;
  }

  async saveEdit(): Promise<void> {
    if (!this.editingManager?.uid || this.editForm.invalid || this.isEditing) return;
    this.isEditing = true;

    const { name, affiliateKey, isActive } = this.editForm.value;

    try {
      await this.firebaseService.updateDashboardUser(this.editingManager.uid, { name, affiliateKey, isActive });
      this.toastr.showSuccess('Account manager updated');
      this.editingManager = null;
    } catch {
      this.toastr.showError('Failed to update account manager');
    } finally {
      this.isEditing = false;
    }
  }

  async saveNewManager(): Promise<void> {
    if (this.addForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const { name, email, password, affiliateKey, isActive } = this.addForm.value;

    try {
      const cred = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user!.uid;

      await this.firebaseService.createDashboardUser(uid, {
        email, name,
        role: 'account_manager',
        isActive,
        affiliateKey,
        createdAt: new Date().toISOString()
      });

      this.showAddForm = false;
      this.buildAddForm();
      this.toastr.showSuccess('Account manager created successfully');
    } catch (err: any) {
      this.toastr.showError(err?.message || 'Failed to create account manager');
    } finally {
      this.isSaving = false;
    }
  }

  get f() { return this.addForm.controls; }
  get ef() { return this.editForm?.controls; }

  getInitial(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
