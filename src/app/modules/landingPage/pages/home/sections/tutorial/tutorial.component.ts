import { Component, Input } from '@angular/core';

interface TutorialStep {
  step: string;
  title: string;
  desc: string;
  img: string;
  video: string;
}

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.css']
})
export class TutorialComponent {
  @Input() sectionTitle: string = 'Getting Started with TestKit';

  steps: TutorialStep[] = [
    { step: 'Step 1', title: 'How to Sign Up', desc: 'Learn the step-by-step process of creating your account', img: 'assets/img/img1.png', video: 'assets/videos/video1.mp4' },
    { step: 'Step 2', title: 'How to Create New Tests', desc: 'Guide to creating and configuring new tests in the system', img: 'assets/img/img2.png', video: 'assets/videos/video1.mp4' },
    { step: 'Step 3', title: 'How to Order New Kit', desc: 'Complete walkthrough of ordering and managing test kits', img: 'assets/img/img3.png', video: 'assets/videos/video1.mp4' },
    { step: 'Step 4', title: 'How to Add New Related User', desc: 'Instructions for adding and managing related user accounts', img: 'assets/img/img4.png', video: 'assets/videos/video1.mp4' }
  ];

  currentStep: TutorialStep | null = null;
  currentIndex: number = 0; // 👈 يبدأ من أول خطوة بشكل افتراضي

  openModal(step: TutorialStep, index: number) {
    this.currentStep = step;
    this.currentIndex = index; // 👈 يظل مؤشر الخطوة محدث حتى لو سكرت المودال

    const video: HTMLVideoElement | null = document.getElementById('videoPlayer') as HTMLVideoElement;
    if (video) {
      video.src = step.video;
      video.currentTime = 0;
      video.play();
    }
  }

  closeModal() {
    this.currentStep = null;
    // 👇 ما منرجع currentIndex = -1 حتى يظل الprogress ظاهر
  }
}
