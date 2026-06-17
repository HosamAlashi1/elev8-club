import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as AOS from 'aos';

@Component({
  selector: 'app-video-questions',
  templateUrl: './video-questions.component.html',
  styleUrls: ['./video-questions.component.css']
})
export class VideoQuestionsComponent implements OnInit, AfterViewInit {
  ngOnInit(): void {
    this.scrollToTop();

    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: 'ease-out-cubic'
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollToTop();
      AOS.refresh();
    }, 100);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}
