import { TestBed } from '@angular/core/testing';
import { TidHeapLinkComponent } from './tid-heap-link.component';

describe('TidHeapLinkComponent', () => {
  it('follows a downlink then resolves a TID', async () => {
    await TestBed.configureTestingModule({ imports: [TidHeapLinkComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TidHeapLinkComponent);
    const component = fixture.componentInstance;
    component.followDownlink(41);
    component.followTid(component.demo.leafEntries[2]);
    expect(component.selectedTuple?.timestampUtc).toBe(1706);
    expect(component.selectedTuple?.alerte).toBe(true);
  });
});
