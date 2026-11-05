import { fakeAsync, tick } from '@angular/core/testing';
import { QuestionFormSectionComponent } from './question-form-section.component';

describe('QuestionFormSectionComponent auto-advance', () => {
  function build(): QuestionFormSectionComponent {
    const gtm = jasmine.createSpyObj('GtmService', ['trackQuestionFormStarted', 'trackQuestionFormProgress']);
    return new QuestionFormSectionComponent({} as never, {} as never, {} as never, gtm, {} as never);
  }
  const firstRadio = (component: QuestionFormSectionComponent) => component.questions.findIndex(q => q.type === 'radio');

  it('moves to the next question by itself after a radio answer', fakeAsync(() => {
    const component = build();
    component.currentQuestion = firstRadio(component);
    const option = component.currentQ.options![0];
    component.handleAnswer(option);
    expect(component.currentQuestion).toBe(firstRadio(component));
    tick(320 + 600);
    expect(component.currentQuestion).toBe(firstRadio(component) + 1);
    expect(component.answers[component.questions[firstRadio(component)].id]).toBe(option);
  }));

  it('lets a quick correction win and advances only once', fakeAsync(() => {
    const component = build();
    component.currentQuestion = firstRadio(component);
    const [first, second] = component.currentQ.options!;
    const id = component.currentQ.id;
    component.handleAnswer(first);
    tick(200);
    component.handleAnswer(second);
    tick(320 + 600);
    expect(component.answers[id]).toBe(second);
    expect(component.currentQuestion).toBe(firstRadio(component) + 1);
  }));

  it('never submits from the last question by choosing an option', fakeAsync(() => {
    const component = build();
    const submit = spyOn(component as never, 'submitAnswers' as never);
    component.currentQuestion = component.questions.length - 1;
    if (component.currentQ.type === 'radio') component.handleAnswer(component.currentQ.options![0]);
    tick(2000);
    expect(submit).not.toHaveBeenCalled();
    expect(component.currentQuestion).toBe(component.questions.length - 1);
  }));

  it('cancels a pending advance when the user presses next or the component is destroyed', fakeAsync(() => {
    const component = build();
    component.currentQuestion = firstRadio(component);
    component.handleAnswer(component.currentQ.options![0]);
    component.ngOnDestroy();
    tick(2000);
    expect(component.currentQuestion).toBe(firstRadio(component));
  }));
});
