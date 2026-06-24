import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Index B-Tree');
  });

  it('toggles the presentation shell and exposes progress', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.presentationMode()).toBe(false);
    expect(app.progress()).toBeGreaterThan(0);
    app.togglePresentation();
    fixture.detectChanges();

    expect(app.presentationMode()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.presentation-shell')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.presentation-controls')).not.toBeNull();
  });

  it('supports presentation keyboard shortcuts', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.onKeydown(new KeyboardEvent('keydown', { key: 'p' }));
    expect(app.presentationMode()).toBe(true);
  });
});
