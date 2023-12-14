import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import {
  boolCV,
  contractPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  tupleCV,
  uintCV
} from '@stacks/transactions';

describe('Proposal Funding', async () => {
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

  const addProposal = () => {
    return simnet.callPublicFn(
      'proposal-submission',
      'propose',
      [
        contractPrincipalCV(deployer, 'test-proposal'),
        stringAsciiCV('Test Add Proposal'),
        stringUtf8CV('Description of the proposal should go here'),
        uintCV(3),
        uintCV(500)
      ],
      address1
    );
  };

  const approveProposal = () => {
    return simnet.callPublicFn(
      'proposal-voting',
      'vote',
      [uintCV(1), boolCV(true), contractPrincipalCV(deployer, 'test-proposal')],
      address1
    );
  };

  const concludeProposal = () => {
    simnet.mineEmptyBlocks(1440);
    return simnet.callPublicFn(
      'proposal-voting',
      'conclude',
      [contractPrincipalCV(deployer, 'test-proposal')],
      address1
    );
  };

  const addConcludedProposal = () => {
    bootstrapWithDeployer();
    addProposal();
    approveProposal();
    concludeProposal();
  };

  const startProposalFunding = () => {
    simnet.callPublicFn(
      'test-extension',
      'call-proposal-funding-start-function',
      [contractPrincipalCV(deployer, 'test-proposal'), uintCV(5), uintCV(100)],
      address1
    );
  };

  describe('is-dao-or-extension', () => {
    it('should correctly tell if caller is the core contract or another extension', () => {
      bootstrapWithDeployer();
      const { result: standardPrincipalResult } = simnet.callPublicFn(
        'proposal-funding',
        'is-dao-or-extension',
        [],
        address1
      );
      expect(standardPrincipalResult).toBeErr(uintCV(4000));

      const { result: extensionResult } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-is-dao-or-extension-function',
        [],
        address1
      );
      expect(extensionResult).toBeOk(boolCV(true));
    });
  });

  describe('start', () => {
    it('should not allow starting a proposal if caller is not an extension', () => {
      addConcludedProposal();
      const { result } = simnet.callPublicFn(
        'proposal-funding',
        'start',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          uintCV(3),
          uintCV(1_000)
        ],
        address1
      );
      expect(result).toBeErr(uintCV(4000));
    });

    it('should allow another extension to start a proposal funding', () => {
      addConcludedProposal();
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-start-function',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          uintCV(3),
          uintCV(1_000)
        ],
        address1
      );
      expect(result).toBeOk(boolCV(true));
    });

    it('should ensure at least one milestone', () => {
      addConcludedProposal();
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-start-function',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          uintCV(0),
          uintCV(1_000)
        ],
        address1
      );
      expect(result).toBeErr(uintCV(4002));
    });

    it('should ensure minimal funding per milestone', () => {
      addConcludedProposal();
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-start-function',
        [contractPrincipalCV(deployer, 'test-proposal'), uintCV(5), uintCV(0)],
        address1
      );
      expect(result).toBeErr(uintCV(4002));
    });

    it('should ensure the proposal was approved and concluded', () => {
      bootstrapWithDeployer();
      addProposal();
      approveProposal();
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-start-function',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          uintCV(5),
          uintCV(100)
        ],
        address1
      );
      expect(result).toBeErr(uintCV(4006));
    });

    it('should ensure the proposal funding was not started already', () => {
      addConcludedProposal();
      simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-start-function',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          uintCV(5),
          uintCV(100)
        ],
        address1
      );
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-funding-start-function',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          uintCV(5),
          uintCV(100)
        ],
        address1
      );
      expect(result).toBeErr(uintCV(4001));
    });
  });

  describe('fund', () => {
    it('should not allow funding a proposal that was not started', () => {
      addConcludedProposal();
      const { result } = simnet.callPublicFn(
        'proposal-funding',
        'fund',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );
      expect(result).toBeErr(uintCV(4004));
    });

    it('should not allow funding a proposal that was already funded', () => {
      addConcludedProposal();
      startProposalFunding();
      simnet.callPublicFn(
        'proposal-funding',
        'fund',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );

      const { result } = simnet.callPublicFn(
        'proposal-funding',
        'fund',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );
      expect(result).toBeErr(uintCV(4003));
    });

    it('should transfer the proposal fund to the contract', () => {
      addConcludedProposal();
      startProposalFunding();
      const { result, events } = simnet.callPublicFn(
        'proposal-funding',
        'fund',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );

      expect(result).toBeOk(uintCV(500));
      expect(events).toMatchInlineSnapshot(`
        [
          {
            "data": {
              "amount": "500",
              "memo": "",
              "recipient": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.proposal-funding",
              "sender": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
            },
            "event": "stx_transfer_event",
          },
        ]
      `);
    });

    it('should set the proposal funded status to true', () => {
      addConcludedProposal();
      startProposalFunding();
      simnet.callPublicFn(
        'proposal-funding',
        'fund',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );
      const funded = simnet.getMapEntry(
        'proposal-funding',
        'proposals',
        contractPrincipalCV(deployer, 'test-proposal')
      );
      expect(funded).toBeSome(
        tupleCV({
          funded: boolCV(true),
          ['completed-milestones']: uintCV(0),
          ['fund-per-milestone']: uintCV(100),
          milestones: uintCV(5)
        })
      );
    });
  });
});
