import {
  estimatePlannerDecision,
  IOT_COLUMN_SCENARIOS,
  PREFIX_QUERY_SCENARIOS
} from './postgres-planner';

describe('PostgreSQL planner experiments', () => {
  it('prefers a sequential scan for the 70% notebook case', () => {
    const result = estimatePlannerDecision({ tableRows: 1_000_000, selectivityPercent: 70, randomPageCost: 4 });
    expect(result.scanType).toBe('Seq Scan');
    expect(result.costs.sequential).toBeLessThan(result.costs.index);
  });

  it('moves from index to bitmap then sequential scan', () => {
    const selections = [0.002, 5, 70].map(selectivityPercent =>
      estimatePlannerDecision({ tableRows: 1_000_000, selectivityPercent, randomPageCost: 4 }).scanType
    );
    expect(selections).toEqual(['Index Scan', 'Bitmap Index Scan', 'Seq Scan']);
  });

  it('captures the IoT partial-index use case', () => {
    const alert = IOT_COLUMN_SCENARIOS.find(scenario => scenario.id === 'alerte');
    expect(alert?.strategy).toContain('partiel');
    expect(alert?.typicalSelectivity).toContain('2 %');
  });

  it('applies the left-prefix rule to the composite index', () => {
    expect(PREFIX_QUERY_SCENARIOS.map(scenario => scenario.indexUsable)).toEqual([true, true, false]);
    expect(PREFIX_QUERY_SCENARIOS.at(-1)?.scanType).toBe('Seq Scan');
  });
});
