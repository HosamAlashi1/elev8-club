import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { LandingAuthSessionService } from 'src/app/modules/services/auth-session.service';
import { HttpService } from 'src/app/modules/services/http.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { ProjectItem, ProjectsResponse } from './models/project.model';
import { AddProjectModalComponent } from './add-project-modal/add-project-modal.component';

@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.css']
})
export class MyProjectsComponent implements OnInit {
  // ========================================
  // 🔹 UI State
  // ========================================
  greetingMessage = '';
  userName = '';
  searchTerm = '';
  
  isLoading$ = new BehaviorSubject<boolean>(true);
  
  // ========================================
  // 🔹 Data State
  // ========================================
  projects: ProjectItem[] = [];
  filteredProjects: ProjectItem[] = [];

  constructor(
    private session: LandingAuthSessionService,
    private router: Router,
    private httpService: HttpService,
    private apiPortal: ApiPortalService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    const user = this.session.user;
    this.userName = user ? user.first_name : '';
    this.setGreeting();
    this.loadProjects();
  }

  // ========================================
  // 🔸 Greeting Message Logic
  // ========================================
  private setGreeting(): void {
    const hour = new Date().getHours();
    const name = this.userName ? `, ${this.userName}` : '';

    let baseGreeting = '';
    if (hour >= 5 && hour < 12) baseGreeting = `Good morning${name}`;
    else if (hour >= 12 && hour < 17) baseGreeting = `Good afternoon${name}`;
    else if (hour >= 17 && hour < 24) baseGreeting = `Good evening${name}`;
    else baseGreeting = `Up late${name}?`;

    this.greetingMessage = [
      `${baseGreeting}, ready to share your next masterpiece? `,
      `A new chapter awaits your creative touch `,
      `The world is waiting for your next story to be told `
    ][Math.floor(Math.random() * 3)];
  }

  // ========================================
  // 🔸 Load Projects from API
  // ========================================
  loadProjects(): void {
    this.isLoading$.next(true);
    
    // Build query params
    const params = new URLSearchParams({
      q: '',
      size: '100',
      page: '1'
    });
    
    const url = `${this.apiPortal.projects.list}?${params.toString()}`;
    
    this.httpService.listGet(url, 'loadProjects').subscribe({
      next: (response: ProjectsResponse) => {
        if (response.success && response.data) {
          this.projects = response.data;
          this.applyFilter();
        }
        this.isLoading$.next(false);
      },
      error: (error) => {
        console.error('Failed to load projects:', error);
        this.projects = [];
        this.filteredProjects = [];
        this.isLoading$.next(false);
      }
    });
  }

  // ========================================
  // 🔸 Filter Projects Locally
  // ========================================
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(p =>
        p.name.toLowerCase().includes(term)
      );
    }
  }

  // ========================================
  // 🔸 Search Input Handler
  // ========================================
  onSearchChange(): void {
    this.applyFilter();
  }

  // ========================================
  // 🔸 Open Add Project Modal
  // ========================================
  openAddProjectModal(): void {
    const modalRef = this.modalService.open(AddProjectModalComponent, {
      size: 'lg',
      centered: true
    });

    // Reload projects list when modal closes with success
    modalRef.closed.subscribe((success: boolean) => {
      if (success) {
        this.loadProjects();
      }
    });
  }

  // ========================================
  // 🔸 Navigate to Project Details
  // ========================================
  openProject(projectId: number): void {
    this.router.navigate(['/audio-portal/my-projects', projectId]);
  }

  // ========================================
  // 🔸 TrackBy for Performance
  // ========================================
  trackByProjectId(index: number, project: ProjectItem): number {
    return project.id;
  }

  // ========================================
  // 🔸 Get First Letter for Avatar Circle
  // ========================================
  getProjectInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'P';
  }

  // ========================================
  // 🔸 Generate Staggered Animation Delay
  // ========================================
  getCardDelay(index: number): string {
    const delay = Math.min(index * 80, 1200);
    return `${delay}ms`;
  }
}

