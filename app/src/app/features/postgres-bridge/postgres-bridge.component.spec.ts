import { TestBed } from '@angular/core/testing';
import { PostgresBridgeComponent } from './postgres-bridge.component';

describe('PostgresBridgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PostgresBridgeComponent] }).compileComponents();
  });

  it('replays the selective and majority notebook presets', () => {
    const fixture = TestBed.createComponent(PostgresBridgeComponent);
    const component = fixture.componentInstance;
    component.activateSelectivityPreset(component.selectivityPresets[0]);
    expect(component.plannerDecision.scanType).toBe('Index Scan');

    component.activateSelectivityPreset(component.selectivityPresets[3]);
    expect(component.plannerDecision.scanType).toBe('Seq Scan');
  });

  it('explains the partial index for rare alerts', () => {
    const fixture = TestBed.createComponent(PostgresBridgeComponent);
    const component = fixture.componentInstance;
    component.selectIotScenario('alerte');

    expect(component.activeIotScenario.strategy).toContain('partiel');
    expect(component.activeIotScenario.query).toContain('TRUE');
  });

  it('rejects the second column without the left prefix', () => {
    const fixture = TestBed.createComponent(PostgresBridgeComponent);
    const component = fixture.componentInstance;
    component.selectPrefixScenario('time');

    expect(component.activePrefixScenario.indexUsable).toBe(false);
    expect(component.activePrefixScenario.scanType).toBe('Seq Scan');
    expect(component.prefixColumnClass('timestamp_utc')).toContain('emerald');
    expect(component.prefixColumnClass('capteur_id')).toContain('slate');
  });

  it('switches explorers while keeping three contextual metrics', () => {
    const fixture = TestBed.createComponent(PostgresBridgeComponent);
    const component = fixture.componentInstance;

    expect(component.activeTab).toBe('selectivity');
    expect(component.chapterMetrics).toHaveLength(3);

    component.setActiveTab('dataset');
    expect(component.activeTab).toBe('dataset');
    expect(component.chapterMetrics).toHaveLength(3);

    component.setActiveTab('prefix');
    expect(component.activeTab).toBe('prefix');
    expect(component.chapterMetrics).toHaveLength(3);
  });

  it('uses the vertical pedagogical layout with conclusion at end', () => {
    const fixture = TestBed.createComponent(PostgresBridgeComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const zones = Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'));

    expect(zones).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.querySelector('[data-chapter-zone="conclusion"]')?.textContent?.length).toBeGreaterThan(0);
  });
});
