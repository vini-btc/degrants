import { beforeEach, describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import {
  boolCV,
  bufferCV,
  contractPrincipalCV,
  principalCV,
  stringCV,
  uintCV
} from '@stacks/transactions';

describe('Core', async () => {
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

  describe('set-extension', () => {
    it('should only allow itself or an enabled extension to enable/disable extensions', () => {
      bootstrapWithDeployer();
      const { result: externalCallerResult } = simnet.callPublicFn(
        'core',
        'set-extension',
        [contractPrincipalCV(deployer, 'test-extension'), boolCV(true)],
        address1
      );
      expect(externalCallerResult).toBeErr(uintCV(1000));

      const { result: extensionResult } = simnet.callPublicFn(
        'test-extension',
        'disable',
        [],
        deployer
      );
      expect(extensionResult).toBeOk(boolCV(true));
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      bootstrapWithDeployer();
    });
    it('should only allow itself or an enabled extension to execute a proposal', () => {
      const { result: externalCallerResult } = simnet.callPublicFn(
        'core',
        'execute',
        [contractPrincipalCV(deployer, 'test-proposal'), principalCV(address1)],
        address1
      );
      expect(externalCallerResult).toBeErr(uintCV(1000));

      const { result: extensionResult } = simnet.callPublicFn(
        'test-extension',
        'execute',
        [contractPrincipalCV(deployer, 'test-proposal'), principalCV(address1)],
        address1
      );
      expect(extensionResult).toBeOk(boolCV(true));
    });

    it('should only allow to execute a proposal once', () => {
      simnet.callPublicFn(
        'test-extension',
        'execute',
        [contractPrincipalCV(deployer, 'test-proposal'), principalCV(address1)],
        address1
      );

      const { result } = simnet.callPublicFn(
        'test-extension',
        'execute',
        [contractPrincipalCV(deployer, 'test-proposal'), principalCV(address1)],
        address1
      );

      expect(result).toBeErr(uintCV(1001));
    });

    it('should execute the proposal', () => {
      const { events } = simnet.callPublicFn(
        'test-extension',
        'execute',
        [contractPrincipalCV(deployer, 'test-proposal'), principalCV(address1)],
        address1
      );
      // The result of the test-proposal execution
      expect(events[1].data.value).toStrictEqual(
        stringCV('proposal-executed', 'ascii')
      );
    });
  });

  describe('construct', () => {
    it('should only allow the deployer to construct the contract', () => {
      simnet.deployContract(
        'another-bootstrap',
        `
        (impl-trait '${deployer}.proposal-trait.proposal-trait)
        (define-public (execute (sender principal))
            (begin
                (try! (contract-call? '${deployer}.core set-extension '${deployer}.test-extension true))
                (ok true)))
      `,
        null,
        address1
      );
      const { result } = simnet.callPublicFn(
        'core',
        'construct',
        [contractPrincipalCV(address1, 'another-bootstrap')],
        address1
      );
      expect(result).toBeErr(uintCV(1000));

      const { result: withDeployerResult } = bootstrapWithDeployer();
      expect(withDeployerResult).toBeOk(boolCV(true));
    });

    it('should only allow the deployer to construct once', () => {
      const { result: withDeployerResult } = bootstrapWithDeployer();
      expect(withDeployerResult).toBeOk(boolCV(true));
      expect(simnet.getDataVar('core', 'executive')).toStrictEqual(
        contractPrincipalCV(deployer, 'core')
      );

      const { result: withDeployerSecondTimeResult } = bootstrapWithDeployer();
      expect(withDeployerSecondTimeResult).toBeErr(uintCV(1000));
    });
  });

  describe('request-extension-callback', () => {
    it('should only allow extensions to request a callback', () => {
      bootstrapWithDeployer();
      const { result: nonExtensionRequestResult } = simnet.callPublicFn(
        'core',
        'request-extension-callback',
        [
          contractPrincipalCV(deployer, 'test-extension'),
          bufferCV(Buffer.from('test', 'ascii'))
        ],
        address1
      );
      expect(nonExtensionRequestResult).toBeErr(uintCV(1002));

      // Calls the callback function via the extension instead of directly
      const { result: extensionRequestResult } = simnet.callPublicFn(
        'test-extension',
        'request-callback',
        [
          contractPrincipalCV(deployer, 'test-extension'),
          bufferCV(Buffer.from('test', 'ascii'))
        ],
        address1
      );
      expect(extensionRequestResult).toBeOk(boolCV(true));
    });

    it('should call the extension callback when triggered', async () => {
      bootstrapWithDeployer();

      const { result } = simnet.callPublicFn(
        'test-extension',
        'request-callback',
        [
          contractPrincipalCV(deployer, 'test-extension'),
          bufferCV(Buffer.from('test', 'ascii'))
        ],
        address1
      );

      expect(result).toBeOk(boolCV(true));
    });
  });
});
