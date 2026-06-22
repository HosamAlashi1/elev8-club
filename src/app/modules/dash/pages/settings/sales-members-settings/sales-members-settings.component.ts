import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { ToastrsService } from '../../../../services/toater.service';
import { SalesMember } from '../../../../../core/models';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-sales-members-settings',
  templateUrl: './sales-members-settings.component.html',
  styleUrls: ['./sales-members-settings.component.css']
})
export class SalesMembersSettingsComponent implements OnInit, OnDestroy {
  members: SalesMember[] = [];
  isLoading = true;
  isSaving = false;
  isEditing = false;
  showAddForm = false;
  addForm!: FormGroup;
  editForm!: FormGroup;
  editingMember: SalesMember | null = null;
  currentVersionKey = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastr: ToastrsService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.buildAddForm();
    this.firebaseService.getCurrentVersion().pipe(
      takeUntil(this.destroy$),
      switchMap(v => {
        this.currentVersionKey = v?.key || '';
        if (!this.currentVersionKey) return of([]);
        return this.firebaseService.getSalesMembersByVersion(this.currentVersionKey);
      })
    ).subscribe(members => {
      this.members = members;
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildAddForm(): void {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      isActive: [true]
    });
  }

  private buildEditForm(member: SalesMember): void {
    this.editForm = this.fb.group({
      name: [member.name, Validators.required],
      phone: [member.phone || ''],
      isActive: [member.isActive]
    });
  }

  toggleActive(member: SalesMember): void {
    if (!member.key) return;
    const newStatus = !member.isActive;
    this.firebaseService.updateSalesMember(member.key, { isActive: newStatus })
      .then(() => {
        member.isActive = newStatus;
        this.toastr.showSuccess(`Member ${newStatus ? 'activated' : 'deactivated'}`);
        if (member.userId) {
          this.firebaseService.updateDashboardUser(member.userId, { isActive: newStatus });
        }
      })
      .catch(() => this.toastr.showError('Failed to update status'));
  }

  delete(member: SalesMember): void {
    if (!member.key || !confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    this.firebaseService.deleteSalesMember(member.key)
      .then(() => this.toastr.showSuccess('Member deleted'))
      .catch(() => this.toastr.showError('Failed to delete'));
  }

  toggleForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) this.buildAddForm();
    this.cancelEdit();
  }

  startEdit(member: SalesMember): void {
    this.editingMember = member;
    this.buildEditForm(member);
    this.showAddForm = false;
  }

  cancelEdit(): void {
    this.editingMember = null;
  }

  async saveEdit(): Promise<void> {
    if (!this.editingMember?.key || this.editForm.invalid || this.isEditing) return;
    this.isEditing = true;

    const { name, phone, isActive } = this.editForm.value;
    const key = this.editingMember.key;
    const userId = this.editingMember.userId;

    try {
      await this.firebaseService.updateSalesMember(key, { name, phone: phone || '', isActive });
      if (userId) {
        await this.firebaseService.updateDashboardUser(userId, { name, isActive });
      }
      this.toastr.showSuccess('Member updated');
      this.editingMember = null;
    } catch {
      this.toastr.showError('Failed to update member');
    } finally {
      this.isEditing = false;
    }
  }

  async saveNewMember(): Promise<void> {
    if (this.addForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const { name, email, phone, password, isActive } = this.addForm.value;

    try {
      const cred = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user!.uid;

      const memberKey = await this.firebaseService.addSalesMember({
        name, email, phone: phone || '',
        userId: uid,
        isActive,
        versionKey: this.currentVersionKey,
        last_assigned_at: null
      });

      await this.firebaseService.createDashboardUser(uid, {
        email, name,
        role: 'sales',
        isActive,
        createdAt: new Date().toISOString(),
        salesMemberKey: memberKey
      });

      this.showAddForm = false;
      this.buildAddForm();
      this.toastr.showSuccess('Sales member created successfully');
    } catch (err: any) {
      this.toastr.showError(err?.message || 'Failed to create member');
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
