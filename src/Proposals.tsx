import React, { ReactElement, useEffect, useState } from 'react';
import {
  AppConfig,
  FinishedAuthData,
  openContractCall,
  showConnect,
  UserSession
} from '@stacks/connect';
import { Nav } from './components/ui/nav';
import axios from 'axios';
import { RefreshCcw } from 'lucide-react';
import {
  contractPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  uintCV
} from '@stacks/transactions';

function Proposals(): ReactElement {
  const [address, setAddress] = useState('');
  const [proposals, setProposals] = useState([]);
  const [submittedProposals, setSubmittedProposals] = useState<{
    [key: string]: string;
  }>({});

  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const userSession = new UserSession({ appConfig });
  const fetchProposals = async () => {
    const response = await axios.get(
      `http://localhost:3010/api/proposals?address=${address}`
    );
    if (response.status === 200) {
      setProposals(response.data);
    }
  };

  useEffect(() => {
    (async () => {
      if (address === '') {
        return;
      }
      await fetchProposals();
    })();
  }, [address]);

  const authOptions = {
    userSession,
    appDetails: {
      name: 'DeGrants',
      icon: 'src/favicon.svg'
    },
    onFinish: (data: FinishedAuthData) => {
      // Handle successful authentication here
      const userData = data.userSession.loadUserData();
      setAddress(userData.profile.stxAddress.testnet); // or .testnet for testnet
    },
    onCancel: () => {
      // Handle authentication cancellation here
    },
    redirectTo: '/'
  };

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setAddress(userSession.loadUserData().profile.stxAddress.testnet);
    } else {
      setAddress('');
    }
  }, [userSession]);

  const connectWallet = () => {
    showConnect(authOptions);
  };

  const disconnectWallet = () => {
    if (userSession.isUserSignedIn()) {
      userSession.signUserOut('/');
      setAddress('');
    }
  };

  const refreshTransaction = async (txId) => {
    await axios.post(
      `http://localhost:3010/api/proposals/refresh-transaction`,
      { txId }
    );
    await fetchProposals();
  };

  const submitToVoting = async ({
    proposer,
    contractName,
    title,
    description,
    milestones,
    fundingPerMilestone,
    txId: proposalTxId
  }) => {
    openContractCall({
      contractAddress: 'ST3RDC4C9B0A2FG8B7DQ9MBTFPYQZNDAVC9AC7MAF',
      contractName: 'proposal-submission',
      functionName: 'propose',
      functionArgs: [
        contractPrincipalCV(proposer, contractName),
        stringAsciiCV(title),
        stringUtf8CV(description),
        uintCV(milestones),
        uintCV(fundingPerMilestone)
      ],
      onFinish: ({ txId }) => {
        setSubmittedProposals({ ...submittedProposals, [proposalTxId]: txId });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 w-full text-slate-400 text-sm leading-loose">
      <Nav
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        address={address}
      />
      <div className="w-full max-w-2xl px-4 my-8">
        <h2 className="text-xl font-bold ml-8 mb-4">Your Proposals</h2>
        {proposals.map(
          ({
            title,
            description,
            milestones,
            status,
            proposer,
            ['genesis-transaction']: txId,
            ['contract-name']: contractName,
            ['fund-per-milestones']: fundingPerMilestone,
            ['votes-for']: votesFor,
            ['votes-against']: votesAgainst
          }) => (
            <div
              className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-lg p-8"
              key={txId}
            >
              <h3 className="font-bold text-lg">{title}</h3>
              <p>{description}</p>
              <div className="flex items-center gap-2">
                <strong>Status:</strong> {status}
                {status === 'mempool' && (
                  <button onClick={() => refreshTransaction(txId)}>
                    <RefreshCcw size={12} />
                  </button>
                )}
              </div>
              {status === 'confirmed' && (
                <button
                  onClick={() =>
                    submitToVoting({
                      proposer,
                      contractName,
                      title,
                      description,
                      milestones,
                      fundingPerMilestone,
                      txId
                    })
                  }
                  className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 hover:bg-slate-800 mt-4"
                >
                  Submit to voting
                </button>
              )}
              {submittedProposals[txId] !== undefined && (
                <p className="text-green-500 mt-4 text-sm">
                  Proposal submitted: {submittedProposals[txId]}
                </p>
              )}
              {['vote_started', 'accepted', 'rejected'].includes(status) && (
                <>
                  <p>
                    Votes: {votesFor} for, {votesAgainst} against.
                  </p>
                </>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Proposals;
