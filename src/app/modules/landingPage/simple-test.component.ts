import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-simple-test',
  template: `
    <div class="container py-5">
      <h1>Simple Test Page</h1>
      <p>If you see this, Angular is working properly.</p>
      <div *ngFor="let item of testItems; let i = index">
        Item {{ i + 1 }}: {{ item }}
      </div>
    </div>
  `
})
export class SimpleTestComponent implements OnInit {
  testItems = ['Test 1', 'Test 2', 'Test 3'];

  ngOnInit() {
    console.log('Simple test component loaded');
  }
}
