import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import {
  boolCV,
  contractPrincipalCV,
  principalCV,
  responseOkCV,
  uintCV
} from '@stacks/transactions';

describe('Membership Token', async () => {
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

  describe('is-dao-or-extension', () => {
    it('should correctly tell if caller is the core contract or another extension', () => {
      bootstrapWithDeployer();
      const { result: standardPrincipalResult } = simnet.callPublicFn(
        'membership-token',
        'is-dao-or-extension',
        [],
        address1
      );
      expect(standardPrincipalResult).toBeErr(uintCV(2000));

      const { result: extensionResult } = simnet.callPublicFn(
        'test-extension',
        'call-membership-token-is-dao-or-extension-function',
        [],
        address1
      );
      expect(extensionResult).toBeOk(boolCV(true));
    });
  });

  describe('mint', () => {
    it('should not mint tokens when called by a standard principal', () => {
      bootstrapWithDeployer();
      const { result: standarPrincipalResult } = simnet.callPublicFn(
        'membership-token',
        'mint',
        [uintCV(10), principalCV(address1)],
        address1
      );
      expect(standarPrincipalResult).toBeErr(uintCV(2000));
    });

    it('should mint tokens when called by an extension contract', () => {
      bootstrapWithDeployer();
      const { result, events } = simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), principalCV(address1)],
        address1
      );
      expect(result).toStrictEqual(responseOkCV(boolCV(true)));
      expect(events[0]).toMatchInlineSnapshot(`
        {
          "data": {
            "amount": "10",
            "asset_identifier": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.membership-token::sGrant",
            "recipient": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          },
          "event": "ft_mint_event",
        }
      `);
    });
  });

  describe('burn', () => {
    it('should not burn a token when called by a standard principal', () => {
      bootstrapWithDeployer();
      // Buys 10 tokens for address 1
      simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), principalCV(address1)],
        address1
      );
      const { result: standarPrincipalResult } = simnet.callPublicFn(
        'membership-token',
        'burn',
        [uintCV(10), principalCV(address1)],
        address1
      );
      expect(standarPrincipalResult).toBeErr(uintCV(2000));
    });

    it('should burn a token when called by an extension contract', () => {
      bootstrapWithDeployer();
      // Buys 10 tokens for address 1
      simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), principalCV(address1)],
        address1
      );
      const { result, events } = simnet.callPublicFn(
        'test-extension',
        'call-membership-token-burn',
        [uintCV(10), principalCV(address1)],
        address1
      );
      expect(result).toStrictEqual(responseOkCV(boolCV(true)));
      expect(events[0]).toMatchInlineSnapshot(`
        {
          "data": {
            "amount": "10",
            "asset_identifier": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.membership-token::sGrant",
            "sender": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          },
          "event": "ft_burn_event",
        }
      `);
    });
  });
});
