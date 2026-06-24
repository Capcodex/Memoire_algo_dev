import { TestBed } from '@angular/core/testing';
import { SameQueryComparatorComponent } from './same-query-comparator.component';

describe('SameQueryComparatorComponent', () => {
  it('runs the same range on both structures', async () => {
    await TestBed.configureTestingModule({ imports: [SameQueryComparatorComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SameQueryComparatorComponent);
    fixture.componentRef.setInput('order', 5);
    fixture.componentRef.setInput('size', 40);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectQuery(component.queries.find(query => query.id === 'range-wide')!);
    expect(component.bplusResult?.results).toEqual(component.btreeResult?.results);
    expect(component.bplusResult?.parentReturns).toBe(0);
    expect(component.maximumSteps).toBeGreaterThan(1);
  });
});
