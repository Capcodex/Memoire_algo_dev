import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IntroComponent } from './intro.component';

describe('IntroComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [IntroComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    const fixture = TestBed.createComponent(IntroComponent);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('displays the main title', async () => {
    const content = await setup();
    expect(content).toContain('Du BST au B+Tree de PostgreSQL');
  });

  it('shows the performance hook sentence with both timings', async () => {
    const content = await setup();
    expect(content).toContain('0,017 ms');
    expect(content).toContain('132 ms');
    expect(content).toContain('1 million');
  });

  it('presents the three progression blocks', async () => {
    const content = await setup();
    expect(content).toContain('BST');
    expect(content).toContain('AVL');
    expect(content).toContain('B-Tree');
    expect(content).toContain('B+Tree');
    expect(content).toContain('PostgreSQL');
  });

  it('states the thesis question in a Problematique block', async () => {
    const content = await setup();
    expect(content).toContain('IoT');
    expect(content).toContain('index PostgreSQL');
  });

  it('describes the dataset with the three tables', async () => {
    const content = await setup();
    expect(content).toContain('sites');
    expect(content).toContain('capteurs');
    expect(content).toContain('000 000');
  });

  it('does not contain removed legacy text', async () => {
    const content = await setup();
    expect(content).not.toContain('Le pivot');
  });
});
