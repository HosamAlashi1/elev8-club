import { Injectable } from '@angular/core';
import { generate } from 'rxjs';
import { environment } from 'src/environments/environment';

const API_BASE_URL = `${environment.apiUrl}/`;

@Injectable({
	providedIn: 'root'
})

// Portal - User APIs
export class ApiPortalService {
  private readonly base = `${environment.apiUrl}/portal/`;

  public books = {
    list: this.base + 'books', // GET
  };

  public projects = {
    list: this.base + 'projects', // GET 
    create: this.base + 'add-project', // POST
    details: (projectId: string) => environment.apiUrl + `/projects/details/${projectId}`, // GET
  };

  public chapters = {
    details: (chapterId: string) => environment.apiUrl + `/projects/chapter-details/${chapterId}`, // GET
    paragraphs: (chapterId: string) => environment.apiUrl + `/projects/chapter-paragraphs/${chapterId}`, // GET
    notes: (chapterId: string) => environment.apiUrl + `/projects/chapter-notes/${chapterId}`, // GET
    create: environment.apiUrl + '/projects/add-chapter', // POST
    edit: (chapterId: string) => environment.apiUrl + `/projects/edit-chapter/${chapterId}`, // POST
    delete: (chapterId: number) => environment.apiUrl + `/projects/delete-chapter/${chapterId}`, // POST
    reorder: (projectId: number) => environment.apiUrl + `/projects/reorder-chapters/${projectId}`, // POST
  }

  public paragraphs = {
    create: environment.apiUrl + '/projects/add-paragraph', // POST
    edit: (paragraphId: string) => environment.apiUrl + `/projects/edit-paragraph/${paragraphId}`, // POST
    delete: (paragraphId: number) => environment.apiUrl + `/projects/delete-paragraph/${paragraphId}`, // POST
    reorder: (chapterId: number) => environment.apiUrl + `/projects/reorder-paragraphs/${chapterId}`, // POST
  }

   public notes = {
    create: environment.apiUrl + '/projects/add-note', // POST
    edit: (noteId: string) => environment.apiUrl + `/projects/edit-note/${noteId}`, // POST
    delete: (noteId: number) => environment.apiUrl + `/projects/delete-note/${noteId}`, // POST
  }

  public voices = {
    generateProject: environment.apiUrl + '/voices/generate-project', // POST
    generateChapter: environment.apiUrl + '/voices/generate-chapter', // POST
    generateParagraph: environment.apiUrl + '/voices/generate-paragraph', // POST
    export: environment.apiUrl + '/voices/export', // POST
    status: (taskId: string) => environment.apiUrl + `/voices/status/${taskId}`, // GET
  }
}

