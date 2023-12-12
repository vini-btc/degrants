import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import {
  boolCV,
  contractPrincipalCV,
  stringAsciiCV,
  stringUtf8CV
} from '@stacks/transactions';

describe('Proposal Submission', async () => {
  const simnet = await initSimnet();
  const accounts = simnet.getAccounts();
  const address1 = accounts.get('wallet_1')!;
  const deployer = accounts.get('deployer')!;

  const bootstrapWithDeployer = () => {
    const result = simnet.callPublicFn(
      'core',
      'construct',
      [contractPrincipalCV(deployer, 'test-bootstrap')],
      deployer
    );
    return result;
  };

  describe('propose', () => {
    it('should correctly tell if caller is the core contract or another extension', () => {
      bootstrapWithDeployer();
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-submission-propose-function',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          stringAsciiCV('Test Proposal'),
          stringUtf8CV('Testing the proposal functionality of this contract.')
        ],
        address1
      );
      expect(result).toBeOk(boolCV(true));
    });
  });
});
