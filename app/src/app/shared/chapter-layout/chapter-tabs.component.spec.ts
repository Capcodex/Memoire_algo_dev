import { TestBed } from '@angular/core/testing';
import { ChapterTabsComponent } from './chapter-tabs.component';

describe('ChapterTabsComponent', () => {
  it('announces and changes the selected tab', async () => {
    await TestBed.configureTestingModule({ imports: [ChapterTabsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ChapterTabsComponent);
    fixture.componentRef.setInput('tabs', [{ id: 'one', label: 'One', description: 'First' }, { id: 'two', label: 'Two', description: 'Second' }]);
    fixture.componentRef.setInput('activeId', 'one');
    const selected: string[] = [];
    fixture.componentInstance.activeIdChange.subscribe(id => selected.push(id));
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    (buttons[1] as HTMLButtonElement).click();
    expect(selected).toEqual(['two']);
  });
});
