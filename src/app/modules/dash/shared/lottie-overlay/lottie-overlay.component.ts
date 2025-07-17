import { Component, Input } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-lottie-overlay',
  templateUrl: './lottie-overlay.component.html',
  styleUrls: ['./lottie-overlay.component.css']
})
export class LottieOverlayComponent {
  @Input() visible = false;
  @Input() options: AnimationOptions = { path: '' };
  @Input() message = '';
  @Input() messageClass = 'text-white';
}
