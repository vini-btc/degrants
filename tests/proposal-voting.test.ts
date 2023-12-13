import { describe, expect, it } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import {
  boolCV,
  contractPrincipalCV,
  standardPrincipalCV,
  stringAsciiCV,
  tupleCV,
  uintCV
} from '@stacks/transactions';
import { stringUtf8 } from '@stacks/transactions/dist/cl';

describe('Proposal Voting', async () => {
  const simnet = await initSimnet();
  const accounts = simnet.getAccounts();
  const address1 = accounts.get('wallet_1')!;
  const address2 = accounts.get('wallet_2')!;
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
        'proposal-voting',
        'is-dao-or-extension',
        [],
        address1
      );
      expect(standardPrincipalResult).toBeErr(uintCV(3000));

      const { result: extensionResult } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-is-dao-or-extension-function',
        [],
        address1
      );
      expect(extensionResult).toBeOk(boolCV(true));
    });
  });

  describe('add-proposal', () => {
    it('should not allow a standard principal to add a proposal', () => {
      bootstrapWithDeployer();
      const { result } = simnet.callPublicFn(
        'proposal-voting',
        'add-proposal',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          tupleCV({
            ['start-block-height']: uintCV(100),
            ['end-block-height']: uintCV(200),
            proposer: standardPrincipalCV(address1),
            title: stringAsciiCV('Test Add Proposal'),
            description: stringUtf8(
              'Test description of the add-proposal function'
            )
          })
        ],
        address1
      );
      expect(result).toBeErr(uintCV(3000));
    });

    it('should allow an extension to add a proposal', () => {
      bootstrapWithDeployer();
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-add-proposal',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          tupleCV({
            ['start-block-height']: uintCV(100),
            ['end-block-height']: uintCV(200),
            proposer: standardPrincipalCV(address1),
            title: stringAsciiCV('Test Add Proposal'),
            description: stringUtf8(
              'Test description of the add-proposal function'
            )
          })
        ],
        address1
      );
      expect(result).toBeOk(boolCV(true));
    });

    it('should not allow an extension to add a proposal that was already added', () => {
      bootstrapWithDeployer();
      const addProposalParams = [
        contractPrincipalCV(deployer, 'test-proposal'),
        tupleCV({
          ['start-block-height']: uintCV(100),
          ['end-block-height']: uintCV(200),
          proposer: standardPrincipalCV(address1),
          title: stringAsciiCV('Test Add Proposal'),
          description: stringUtf8(
            'Test description of the add-proposal function'
          )
        })
      ];
      simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-add-proposal',
        addProposalParams,
        address1
      );
      const { result } = simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-add-proposal',
        addProposalParams,
        address1
      );
      expect(result).toBeErr(uintCV(3003));
    });
  });

  describe('vote', () => {
    const proposal = {
      ['start-block-height']: uintCV(100),
      ['end-block-height']: uintCV(200),
      proposer: standardPrincipalCV(address1),
      title: stringAsciiCV('Test Add Proposal'),
      description: stringUtf8('Test description of the add-proposal function')
    };

    it('should not allow voting on an unkown proposal', () => {
      bootstrapWithDeployer();
      simnet.deployContract(
        'unheard-of-test-proposal',
        '(define-public (execute (sender principal)) (ok true))',
        null,
        deployer
      );
      const { result } = simnet.callPublicFn(
        'proposal-voting',
        'vote',
        [
          uintCV(10),
          boolCV(true),
          contractPrincipalCV(deployer, 'unheard-of-test-proposal')
        ],
        address1
      );
      expect(result).toBeErr(uintCV(3004));
    });

    it('should allow members with tokens to vote on a proposal', () => {
      bootstrapWithDeployer();
      simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), standardPrincipalCV(address1)],
        address1
      );
      simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-add-proposal',
        [contractPrincipalCV(deployer, 'test-proposal'), tupleCV(proposal)],
        address1
      );
      const { result } = simnet.callPublicFn(
        'proposal-voting',
        'vote',
        [
          uintCV(10),
          boolCV(true),
          contractPrincipalCV(deployer, 'test-proposal')
        ],
        address1
      );
      expect(result).toBeOk(
        tupleCV({
          amount: uintCV(10),
          event: stringAsciiCV('vote'),
          for: boolCV(true),
          proposal: contractPrincipalCV(deployer, 'test-proposal'),
          voter: standardPrincipalCV(address1)
        })
      );
      const votes = simnet.getMapEntry(
        'proposal-voting',
        'proposals',
        contractPrincipalCV(deployer, 'test-proposal')
      );
      expect(votes).toBeSome(
        tupleCV({
          ...proposal,
          ['votes-for']: uintCV(10),
          ['votes-against']: uintCV(0),
          ['concluded']: boolCV(false),
          ['passed']: boolCV(false)
        })
      );
    });
    it('should increment votes on the side after vote on a proposal', () => {
      bootstrapWithDeployer();
      simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), standardPrincipalCV(address1)],
        address1
      );
      simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-add-proposal',
        [contractPrincipalCV(deployer, 'test-proposal'), tupleCV(proposal)],
        address1
      );
      const votesBefore = simnet.getMapEntry(
        'proposal-voting',
        'proposals',
        contractPrincipalCV(deployer, 'test-proposal')
      );
      simnet.callPublicFn(
        'proposal-voting',
        'vote',
        [
          uintCV(10),
          boolCV(true),
          contractPrincipalCV(deployer, 'test-proposal')
        ],
        address1
      );
      const votesAfter = simnet.getMapEntry(
        'proposal-voting',
        'proposals',
        contractPrincipalCV(deployer, 'test-proposal')
      );

      expect(votesBefore).toBeSome(
        tupleCV({
          ...proposal,
          ['votes-for']: uintCV(0),
          ['votes-against']: uintCV(0),
          ['concluded']: boolCV(false),
          ['passed']: boolCV(false)
        })
      );
      expect(votesAfter).toBeSome(
        tupleCV({
          ...proposal,
          ['votes-for']: uintCV(10),
          ['votes-against']: uintCV(0),
          ['concluded']: boolCV(false),
          ['passed']: boolCV(false)
        })
      );
    });
  });

  describe('conclude', () => {
    const addTestProposal = () => {
      simnet.callPublicFn(
        'test-extension',
        'call-proposal-voting-add-proposal',
        [
          contractPrincipalCV(deployer, 'test-proposal'),
          tupleCV({
            ['start-block-height']: uintCV(100),
            ['end-block-height']: uintCV(200),
            proposer: standardPrincipalCV(address1),
            title: stringAsciiCV('Test Add Proposal'),
            description: stringUtf8(
              'Test description of the add-proposal function'
            )
          })
        ],
        address1
      );
    };
    it('should only allow concluding a known proposal', () => {
      bootstrapWithDeployer();
      simnet.deployContract(
        'unheard-of-test-proposal',
        '(define-public (execute (sender principal)) (ok true))',
        null,
        deployer
      );
      const { result } = simnet.callPublicFn(
        'proposal-voting',
        'conclude',
        [contractPrincipalCV(deployer, 'unheard-of-test-proposal')],
        address1
      );
      expect(result).toBeErr(uintCV(3004));
    });

    it('should only allow concluding a proposal that was not already concluded', () => {
      bootstrapWithDeployer();
      addTestProposal();
      // Make sure end block height was reached
      simnet.mineEmptyBlocks(200);
      // Concludes proposal
      simnet.callPublicFn(
        'proposal-voting',
        'conclude',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );

      const { result } = simnet.callPublicFn(
        'proposal-voting',
        'conclude',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );
      expect(result).toBeErr(uintCV(3005));
    });

    it('should only allow concluding a proposal after it reached its end block height', () => {
      bootstrapWithDeployer();
      addTestProposal();
      const { result } = simnet.callPublicFn(
        'proposal-voting',
        'conclude',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );
      expect(result).toBeErr(uintCV(3009));
    });

    it('should conclude and execute a proposal if it had more votes for than against', () => {
      bootstrapWithDeployer();
      addTestProposal();
      simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), standardPrincipalCV(address1)],
        deployer
      );
      simnet.callPublicFn(
        'test-extension',
        'call-membership-token-mint',
        [uintCV(10), standardPrincipalCV(address2)],
        deployer
      );
      simnet.callPublicFn(
        'proposal-voting',
        'vote',
        [
          uintCV(10),
          boolCV(true),
          contractPrincipalCV(deployer, 'test-proposal')
        ],
        address1
      );
      // make sure we're past the end block
      simnet.mineEmptyBlocks(200);
      const { result, events } = simnet.callPublicFn(
        'proposal-voting',
        'conclude',
        [contractPrincipalCV(deployer, 'test-proposal')],
        address1
      );
      expect(result).toBeOk(boolCV(true));
      // event triggered in the proposal execute function
      expect(events[2]).toMatchInlineSnapshot(`
        {
          "data": {
            "contract_identifier": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.test-proposal",
            "raw_value": "0x0d0000001170726f706f73616c2d6578656375746564",
            "topic": "print",
            "value": {
              "data": "proposal-executed",
              "type": 13,
            },
          },
          "event": "print_event",
        }
      `);
    });
  });
});
