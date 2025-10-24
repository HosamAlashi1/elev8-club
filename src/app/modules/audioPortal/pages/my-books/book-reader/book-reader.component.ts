import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { HttpClient } from '@angular/common/http';
import { buildPages } from './utils/page-factory';

@Component({
  selector: 'app-book-reader',
  templateUrl: './book-reader.component.html',
  styleUrls: ['./book-reader.component.css']
})
export class BookReaderComponent implements OnInit {
  projectId!: number;
  project: any;
  chapters: any[] = [];
  paragraphs: any[] = [];
  selectedChapterId: number | null = null;
  isLoading = true;

  // ✅ الصفحات الجاهزة للتمرير إلى BookFlip
  pages: HTMLElement[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiPortalService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.loadProjectDetails();
  }

  async loadProjectDetails() {
    try {
      const response: any = await this.http.get(
        this.api.projects.details(String(this.projectId))
      ).toPromise();

      if (response?.success) {
        this.project = response.data;
        this.chapters = response.data.chapters || [];

        // افتح أول فصل تلقائياً
        const first = this.chapters[0];
        if (first) {
          await this.selectChapter(first.id, first.title);
        }
      }
    } catch (err) {
      console.error('Error loading project details:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async selectChapter(chapterId: number, titleFromList?: string) {
    this.selectedChapterId = chapterId;
    this.isLoading = true;
    try {
      const response: any = await this.http.get(
        this.api.chapters.paragraphs(String(chapterId))
      ).toPromise();

      if (response?.success) {
        this.paragraphs = response.data;

        // ✅ كوّن الصفحات مرة واحدة فقط هنا
        const title = titleFromList
          ?? (this.chapters.find(c => c.id === chapterId)?.title ?? 'Chapter');
        this.pages = buildPages(title, this.paragraphs);
      }
    } catch (err) {
      console.error('Error loading paragraphs:', err);
    } finally {
      this.isLoading = false;
    }
  }
  
  trackById = (_: number, item: any) => item.id;
}
