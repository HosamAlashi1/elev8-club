import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-store-info',
  templateUrl: './store-info.component.html',
  styleUrls: ['./store-info.component.css']
})
export class StoreInfoComponent {
  form: FormGroup;

  // --- حالة الدراج-أند-دروب
  dragOver = false;

  // --- ملف الشعار ومعاينته
  logoFile?: File | null;
  logoPreview: string | null = null;

  // حدّ أقصى لحجم الشعار (MB)
  readonly MAX_LOGO_MB = 5;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      storeName: ['BookStore', [Validators.required, Validators.maxLength(120)]],
      email: ['contact@bookstore.com', [Validators.required, Validators.email]],
      phone: ['+44 123 456 7890', [Validators.required, Validators.maxLength(30)]],
      openTime: ['09:00', Validators.required],
      closeTime: ['18:00', Validators.required],
      address: ['123 Book Street, Reading, UK', Validators.required]
    });
  }

  // حجم الملف كنص لطيف
  get logoSize(): string {
    if (!this.logoFile) return '';
    const mb = this.logoFile.size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  // --- Logo upload handlers
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragOver = false; }

  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.setLogo(f);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) this.setLogo(f);
  }

  private setLogo(file: File) {
    // تحقق الحجم
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > this.MAX_LOGO_MB) {
      console.error(`Max size is ${this.MAX_LOGO_MB} MB`);
      return;
    }
    // تحقق النوع (صور فقط)
    if (!file.type.startsWith('image/')) {
      console.error('Logo must be an image.');
      return;
    }

    this.logoFile = file;

    // معاينة الصورة
    const reader = new FileReader();
    reader.onload = (ev: any) => this.logoPreview = ev.target.result;
    reader.readAsDataURL(file);
  }

  clearLogo() {
    this.logoFile = null;
    this.logoPreview = null;
  }

  onCancel() {
    this.form.reset({
      storeName: 'BookStore',
      email: 'contact@bookstore.com',
      phone: '+44 123 456 7890',
      openTime: '09:00',
      closeTime: '18:00',
      address: '123 Book Street, Reading, UK'
    });
    this.clearLogo();
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // جهّز البيلود — تقدر تحوله لـ FormData لو API يستقبل ملفات
    // const fd = new FormData();
    // Object.entries(this.form.value).forEach(([k, v]) => fd.append(k, String(v ?? '')));
    // if (this.logoFile) fd.append('logo', this.logoFile);

    const payload = { ...this.form.value, logoFile: this.logoFile ?? null };

    console.log('Store info payload:', payload);
    // TODO: استبدلها بنداء الخدمة الحقيقية:
    // this.settingsService.saveStoreInfo(fd or payload).subscribe(...)
  }
}
