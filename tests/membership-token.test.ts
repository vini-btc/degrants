import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';

describe('Membership Token', async () => {
  const simnet = await initSimnet();
  it('ensures simnet is well initalised', () => {
    expect(simnet.blockHeight).toBeDefined();
  });
});
