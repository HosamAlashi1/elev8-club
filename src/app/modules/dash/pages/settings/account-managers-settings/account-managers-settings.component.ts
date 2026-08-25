import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { ToastrsService } from '../../../../services/toater.service';
import { DashboardUser } from '../../../../../core/models';

@Component({
  selector: 'app-account-managers-settings',
  templateUrl: './account-managers-settings.component.html',
  styleUrls: ['./account-managers-settings.component.css']
})
export class AccountManagersSettingsComponent implements OnInit, OnDestroy {
  managers: DashboardUser[] = [];
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
    private toastr: ToastrsService
  ) {}

  currentVersionKey = '';

  ngOnInit(): void {
    this.buildAddForm();
    this.firebaseService.getCurrentVersion().pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.currentVersionKey = v?.key || '';
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
      isActive: [true]
    });
  }

  private buildEditForm(manager: DashboardUser): void {
    this.editForm = this.fb.group({
      name: [manager.name, Validators.required],
      email: [manager.email, [Validators.required, Validators.email]],
      password: ['', Validators.minLength(8)],
      isActive: [manager.isActive]
    });
  }

  loadManagers(): void {
    this.firebaseService.getAllDashboardUsers().pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.managers = users.filter(u => u.role === 'account_manager');
      this.managers.forEach(manager => this.migrateLegacyAffiliateLink(manager));
      this.isLoading = false;
    });
  }

  private migrateLegacyAffiliateLink(manager: DashboardUser): void {
    if (!manager.uid || !manager.affiliateKey) return;
    this.firebaseService.updateAffiliate(manager.affiliateKey, {
      accountManagerKey: manager.uid,
      accountManagerAssignedAt: Date.now()
    });
    this.firebaseService.updateDashboardUser(manager.uid, {
      affiliateKey: null as any,
      versionKey: manager.versionKey || this.currentVersionKey
    });
  }

  toggleActive(manager: DashboardUser): void {
    if (!manager.uid) return;
    const newStatus = !manager.isActive;
    this.firebaseService.updateDashboardAuthUser({ uid: manager.uid, isActive: newStatus })
      .then(() => {
        manager.isActive = newStatus;
        this.toastr.showSuccess(`Account manager ${newStatus ? 'activated' : 'deactivated'}`);
      })
      .catch(() => this.toastr.showError('Failed to update status'));
  }

  delete(manager: DashboardUser): void {
    if (!manager.uid || !confirm(`Delete account for ${manager.name}? This cannot be undone.`)) return;
    Promise.all([
      this.firebaseService.updateDashboardUser(manager.uid, { role: 'deleted' as any, isActive: false }),
      this.firebaseService.updateDashboardAuthUser({ uid: manager.uid, isActive: false })
    ])
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

    const { name, email, password, isActive } = this.editForm.value;

    try {
      await this.firebaseService.updateDashboardAuthUser({
        uid: this.editingManager.uid,
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        isActive
      });
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

    const { name, email, password, isActive } = this.addForm.value;

    try {
      const result = await this.firebaseService.createDashboardAuthUser({
        email: email.trim(),
        password,
        name: name.trim(),
        role: 'account_manager',
        versionKey: this.currentVersionKey
      });
      if (!isActive) {
        await this.firebaseService.updateDashboardAuthUser({ uid: result.uid, isActive: false });
      }

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
