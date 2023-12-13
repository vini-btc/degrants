import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import { boolCV, contractPrincipalCV } from '@stacks/transactions';

describe('Bootstrap', async () => {
  const simnet = await initSimnet();
  const accounts = simnet.getAccounts();
  const deployer = accounts.get('deployer')!;

  describe('execute', () => {
    it('should enable all degrant extensions and mint membership tokens to the corresponding accounts', () => {
      const { result, events } = simnet.callPublicFn(
        'core',
        'construct',
        [contractPrincipalCV(deployer, 'bootstrap')],
        deployer
      );
      expect(result).toBeOk(boolCV(true));
      expect(events).toMatchSnapshot();
    });
  });
});
