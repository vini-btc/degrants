import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';

describe('Proposal Trait', async () => {
  const simnet = await initSimnet();
  it('ensures simnet is well initalised', () => {
    expect(simnet.blockHeight).toBeDefined();
  });
});
