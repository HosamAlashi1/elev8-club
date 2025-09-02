import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-free-guide-form',
  templateUrl: './free-guide-form.component.html',
  styleUrls: ['./free-guide-form.component.css']
})
export class FreeGuideFormComponent implements OnInit {
  @Input() title!: string;
  @Input() submitText: string = 'Send Me the Guide';
  @Output() submitted = new EventEmitter<any>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      manuscript: [''],
      stage: ['Writing', Validators.required],
      message: ['']
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // يبين كل الأخطاء
      return;
    }
    this.submitted.emit(this.form.value);
    this.form.reset({ stage: 'Writing' }); // reset مع قيمة افتراضية للـ stage
  }

  hasError(control: string, error: string): boolean {
    return this.form.get(control)?.hasError(error) && this.form.get(control)?.touched || false;
  }
}
