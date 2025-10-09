import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ToastrsService } from '../../../../../services/toater.service';
import { ApiAdminService } from '../../../../../services/api.admin.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

interface PermissionItem {
  id: number;
  name: string;
  code: string;
  parent_id: number;
}
interface PermissionGroup extends PermissionItem {
  sub_permissions: PermissionItem[];
}

@Component({
  selector: 'app-add-edit-role',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditRoleComponent implements OnInit {

  @Input() role: { id?: number; name?: string; permissions?: PermissionItem[] } | null = null;

  form!: FormGroup;
  submitted = false;

  groups: PermissionGroup[] = [];
  allPermissionIds: number[] = [];

  isLoading$ = new BehaviorSubject<boolean>(true);
  isSaving$ = new BehaviorSubject<boolean>(false);

  expanded = new Set<number>();

  get isEdit(): boolean {
    return !!this.role?.id;
  }

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private toastr: ToastrsService,
    private api: ApiAdminService
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.isEdit && this.role?.id) {
      this.loadForEdit(this.role.id);
    } else {
      this.loadCatalogOnly();
    }
  }

  initForm(): void {
    this.form = new FormGroup({
      name: new FormControl(this.role?.name || '', [Validators.required, Validators.maxLength(190)]),
      permissions_ids: new FormControl<number[]>([])
    });
  }

  // --- LOADERS ---------------------------------------------------------------

  // بحالة الإضافة: بنجيب الكاتالوج العام فقط
  private loadCatalogOnly(): void {
    this.isLoading$.next(true);
    this.httpService.listGet(this.api.common.permissions, 'permissions-list')
      .pipe(finalize(() => {
        this.isLoading$.next(false);
        setTimeout(() => {
          document.querySelector('.permissions-container')?.classList.add('ng-animating');
        }, 100);
      })
      )
      .subscribe({
        next: (res: any) => {
          const catalog: PermissionGroup[] = (res?.success && Array.isArray(res?.data)) ? res.data : [];
          this.prepareGroups(catalog);
          // افتح الكل بشكل افتراضي
          this.groups.forEach(g => this.expanded.add(g.id));
        },
        error: () => {
          this.groups = [];
          this.allPermissionIds = [];
          this.toastr.showError('Failed to load permissions');
        }
      });
  }

  // بحالة التعديل: بنجيب (details + catalog) معاً
  private loadForEdit(id: number): void {
    this.isLoading$.next(true);

    forkJoin({
      details: this.httpService.listGet(this.api.roles.details(id), 'role-details'),
      catalog: this.httpService.listGet(this.api.common.permissions, 'permissions-list')
    })
      .pipe(finalize(() => {
        this.isLoading$.next(false);
        setTimeout(() => {
          document.querySelector('.permissions-container')?.classList.add('ng-animating');
        }, 100);
      }))
      .subscribe({
        next: ({ details, catalog }: any) => {
          // اسم الدور من التفاصيل
          const r = details?.data?.role;
          this.form.patchValue({ name: r?.name || '' });

          // بنبني الشجرة من الكاتالوج العام فقط (مش من details)
          const groups: PermissionGroup[] = (catalog?.success && Array.isArray(catalog?.data)) ? catalog.data : [];
          this.prepareGroups(groups);

          // IDs المختارة من role.permissions (قائمة مسطحة تضم آباء وأبناء)
          const preSelected: number[] = Array.isArray(r?.permissions)
            ? Array.from(new Set((r.permissions as PermissionItem[]).map(p => p.id)))
            : [];

          this.form.patchValue({ permissions_ids: preSelected });

          // افتح الكل
          this.groups.forEach(g => this.expanded.add(g.id));
        },
        error: () => {
          this.toastr.showError('Failed to load role data');
        }
      });
  }

  private prepareGroups(groups: PermissionGroup[]): void {
    const normalized: PermissionGroup[] = (groups || []).map(g => ({
      ...g,
      sub_permissions: Array.isArray(g.sub_permissions) ? g.sub_permissions : []
    }));

    const sorted = normalized
      .map(g => ({
        ...g,
        sub_permissions: [...g.sub_permissions].sort((a, b) => a.name.localeCompare(b.name))
      }))
      ;

    this.groups = sorted;
    this.allPermissionIds = this.groups.flatMap(g => [g.id, ...g.sub_permissions.map(sp => sp.id)]);
  }

  // --- HELPERS --------------------------------------------------------------

  get f() { return this.form.controls; }

  private get selected(): number[] {
    return this.form.value.permissions_ids || [];
  }
  private set selected(val: number[]) {
    this.form.patchValue({ permissions_ids: val }, { emitEvent: false });
  }

  isChecked(id: number): boolean {
    return this.selected.includes(id);
  }

  isGroupAllChecked(g: PermissionGroup): boolean {
    const allKids = g.sub_permissions.every(sp => this.isChecked(sp.id));
    return this.isChecked(g.id) && allKids;
  }
  isGroupIndeterminate(g: PermissionGroup): boolean {
    const anyKid = g.sub_permissions.some(sp => this.isChecked(sp.id));
    const allKids = g.sub_permissions.every(sp => this.isChecked(sp.id));
    return anyKid && !allKids;
  }
  groupSelectedCount(g: PermissionGroup): number {
    let c = this.isChecked(g.id) ? 1 : 0;
    c += g.sub_permissions.filter(sp => this.isChecked(sp.id)).length;
    return c;
  }

  // --- TOGGLES --------------------------------------------------------------

  toggleSelectAll(allChecked: boolean): void {
    this.selected = allChecked ? [...this.allPermissionIds] : [];
  }

  toggleGroup(g: PermissionGroup, checked: boolean): void {
    const cur = new Set(this.selected);
    if (checked) {
      cur.add(g.id);
      g.sub_permissions.forEach(sp => cur.add(sp.id));
    } else {
      cur.delete(g.id);
      g.sub_permissions.forEach(sp => cur.delete(sp.id));
    }
    this.selected = Array.from(cur);
  }

  toggleChild(g: PermissionGroup, sp: PermissionItem, checked: boolean): void {
    const cur = new Set(this.selected);
    if (checked) {
      cur.add(sp.id);
      cur.add(g.id); // ضمان اختيار الأب
    } else {
      cur.delete(sp.id);
      const anyLeft = g.sub_permissions.some(x => cur.has(x.id));
      if (!anyLeft) cur.delete(g.id);
    }
    this.selected = Array.from(cur);
  }

  toggleExpand(g: PermissionGroup): void {
    if (this.expanded.has(g.id)) this.expanded.delete(g.id);
    else this.expanded.add(g.id);
  }

  get allSelected(): boolean {
    return this.selected.length > 0 && this.selected.length === this.allPermissionIds.length;
  }

  // --- SUBMIT ---------------------------------------------------------------

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const payload = {
      name: String(this.form.value.name || '').trim(),
      permissions_ids: this.selected
    };

    const url = this.isEdit && this.role?.id
      ? this.api.roles.edit(this.role.id)
      : this.api.roles.add;

    this.isSaving$.next(true);
    this.httpService.action(url, payload, 'addEditRole')
      .pipe(finalize(() => this.isSaving$.next(false)))
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.toastr.showSuccess(res?.msg || 'Saved successfully');
            this.activeModal.close(true);
          } else {
            this.toastr.showError(res?.msg || 'Operation failed');
          }
        },
        error: (err: any) => {
          const msg = err?.error?.msg || err?.message || 'Operation failed';
          this.toastr.showError(msg);
        }
      });
  }
}
