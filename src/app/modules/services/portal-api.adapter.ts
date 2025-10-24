import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';

export interface ProjectDTO {
  id: number;
  name: string;
  voice_key: string;
  chapters: { id: number; title: string }[];
  process?: { id: number; status: number } | null;
  voice_url: string;
}

export interface ParagraphDTO {
  id: number;
  text: string;
  is_title: boolean;
  voice_key: string;
  voice_url?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PortalApiAdapter {
  constructor(private api: ApiPortalService, private http: HttpClient) {}

  getProject(projectId: number) {
    const url = this.api.projects.details(String(projectId));
    return this.http.get<{ success: boolean; data: ProjectDTO }>(url);
  }

  getChapterParagraphs(chapterId: number) {
    const url = this.api.chapters.paragraphs(String(chapterId));
    return this.http.get<{ success: boolean; data: ParagraphDTO[] }>(url);
  }
}
