import { Component, OnInit } from '@angular/core';
import * as AOS from 'aos';

@Component({
  selector: 'app-video-questions',
  templateUrl: './video-questions.component.html',
  styleUrls: ['./video-questions.component.css']
})
export class VideoQuestionsComponent implements OnInit {
  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: 'ease-out-cubic'
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }
}
