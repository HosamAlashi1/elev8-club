import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ToastrsService } from '../../../../services/toater.service';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-add-edit-role',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  role: any;
  form: FormGroup;
  submitted = false;
  allSelected = false;

  allPermissions: any[] = [];
  groupedPermissions: any = {};

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private toastrsService: ToastrsService,
    private api: ApiService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadPermissions();
  }

  get f() {
    return this.form.controls;
  }

  initForm(): void {
    this.form = new FormGroup({
      name: new FormControl(this.role?.name || '', Validators.required),
      permissions: new FormControl([]) // IDs
    });
  }

  loadPermissions(): void {
    this.httpService.list(this.api.permissions.list, {}, 'permissions').subscribe({
      next: (res) => {
        const permissions = res?.items || [];
        this.groupedPermissions = {};

        permissions.forEach((perm: any) => {
          if (perm.is_root === 1 && Array.isArray(perm.submenu)) {
            this.groupedPermissions[perm.title] = perm.submenu;
          } else if (perm.is_root === 0) {
            this.groupedPermissions['General'] ??= [];
            this.groupedPermissions['General'].push(perm);
          }
        });

        this.allPermissions = Object.values(this.groupedPermissions).flat();

        // Fill form if edit
        if (this.role?.id && this.role.permissions) {
          const selectedIds = this.role.permissions.map((p: any) => p.id);
          this.form.patchValue({ permissions: selectedIds });
          this.checkAllSelected();
        }
      }
    });
  }

  togglePermission(id: number): void {
    const current = this.form.value.permissions || [];
    const updated = current.includes(id)
      ? current.filter((pid: number) => pid !== id)
      : [...current, id];

    this.form.patchValue({ permissions: updated });
    this.checkAllSelected();
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.form.patchValue({ permissions: [] });
    } else {
      const allIds = this.allPermissions.map((p) => p.id);
      this.form.patchValue({ permissions: allIds });
    }
    this.allSelected = !this.allSelected;
  }

  checkAllSelected(): void {
    this.allSelected = this.form.value.permissions.length === this.allPermissions.length;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const payload = {
      name: this.form.value.name,
      permissions: this.form.value.permissions
    };

    const url = this.role?.id
      ? this.api.roles.edit(this.role.id)
      : this.api.roles.add;

    this.httpService.setLoading('addEditRole', true);

    this.httpService.action(url, payload, 'addEditRole').subscribe({
      next: (res: any) => {
        this.toastrsService.Showsuccess(res.message || 'Saved');
        this.activeModal.close(true);
      },
      error: () => {
        this.httpService.setLoading('addEditRole', false);
      },
      complete: () => {
        this.httpService.setLoading('addEditRole', false);
      }
    });
  }

  castToArray(val: unknown): any[] {
    return Array.isArray(val) ? val : [];
  }

}
