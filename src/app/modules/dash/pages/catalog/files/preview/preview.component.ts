import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PublicService } from 'src/app/modules/services/public.service';
import { AddEditFileComponent } from '../add-edit/add-edit.component';
import { ApiAdminService } from 'src/app/modules/services/api.admin.service';

@Component({
  selector: 'app-preview-modal',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewModalComponent {
  @Input() file: any;

  constructor(
    public activeModal: NgbActiveModal,
    public publicService: PublicService,
    private modalService: NgbModal,
    private api: ApiAdminService
  ) { }

  /** 🔹 Friendly file type */
  getFriendlyType(mimeType: string): string {
    if (!mimeType) return 'Unknown';
    const type = mimeType.toLowerCase();

    if (type.startsWith('image/')) return 'Image';
    if (type === 'application/pdf') return 'PDF';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.startsWith('video/')) return 'Video';
    if (type === 'application/msword' || type.includes('wordprocessingml')) return 'Word';

    return 'File';
  }

  /** 🔁 Replace file and refresh parent */
  replaceFile(): void {
    const modalRef = this.modalService.open(AddEditFileComponent, { size: 'md', centered: true });
    modalRef.componentInstance.file = this.file;

    modalRef.result
      .then((res) => {
        if (res) this.activeModal.close(true);
      })
      .catch(() => { });
  }

  downloadFile(): void {
    const fileName = this.file?.file_name || 'downloaded_file';
    const fileUrl = this.api.files.download(this.file.id);

    //  نستخدم fetch لتحميل الملف كـ blob
    fetch(fileUrl, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to download file.');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        // fallback لو صار خطأ، افتح الرابط عادي
        window.open(fileUrl, '_blank');
      });
  }

}
