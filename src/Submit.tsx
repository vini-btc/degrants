import axios from 'axios';
import React, { ReactElement, useEffect, useState } from 'react';
import slugify from '@sindresorhus/slugify';
import {
  AppConfig,
  FinishedAuthData,
  openContractDeploy,
  showConnect,
  UserSession
} from '@stacks/connect';
import { Nav } from './components/ui/nav';

function Submit(): ReactElement {
  const [address, setAddress] = useState('');
  const [txId, setTxId] = useState('');
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [milestones, setMilestones] = useState(1);
  const [fundPerMilestone, setFundPerMilestone] = useState(1_000);

  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const userSession = new UserSession({ appConfig });

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

  // @TODO: Implement fund validation
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address) {
      setGeneralError('Please connect your wallet');
    }
    if (title.length <= 0 || title.length >= 30) {
      setTitleError('Invalid proposal title');
    }
    if (description.length <= 0 || description.length >= 500) {
      setDescriptionError('Invalid proposal description');
    }
    const contractName = slugify(title);
    // @TODO: Before using the data in the contract template like this, we should strip/serialize/validate it;
    openContractDeploy({
      contractName,
      codeBody: `
        (impl-trait .proposal-trait.proposal-trait)
        (define-constant err-already-executed (err u1))
        (define-constant title "${title}")
        (define-constant description "${description}")
        (define-constant milestones u${milestones})
        (define-constant fund-per-milestone u${fundPerMilestone})
        (define-data-var status bool false)
        (define-public (execute (sender principal))
            (begin
                (asserts! (not (var-get status)) err-already-executed)
                (var-set status true)
                (ok true)))
        (define-read-only (get-status) (var-get status))
        (define-read-only (get-proposal-data)
            (ok { milestones: milestones, title: title, description: description, fund-per-milestone: fund-per-milestone }))
      `,
      onFinish: async (data) => {
        const deploymentTxId = `0x${data.txId}`;
        setTxId(deploymentTxId);
        await axios.post('http://localhost:3010/listen/proposal/new', {
          contractName,
          title,
          description,
          milestones,
          fundPerMilestone,
          proposer: address,
          txId: deploymentTxId
        });
        setTitle('');
        setDescription('');
        setMilestones(1);
        setFundPerMilestone(1_000);
      }
    });
    // @TODO 1: Deploy contract with proposal to testnet (use template to have funding addition on the execute bit)
    // @TODO 2: Activate proposal - call proposal-submission.propose
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 w-full text-slate-400 text-sm leading-loose">
      <Nav
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        address={address}
      />
      <div className="mx-auto max-w-2xl px-4 pt-48 lg:pt-16">
        <div className="rounded-lg border bg-background p-8">
          <h1 className="mb-2 text-lg font-bold text-slate-900">
            Submit a proposal
          </h1>
          <p className="leading-normal text-muted-foreground">
            Submit your proposal for community appreciation. Please fill in the
            details carefully: this proposal will be permanently stored on the
            Stacks blockchain.
          </p>
        </div>
      </div>
      <div className="w-full max-w-2xl px-4 my-8">
        <h2 className="text-xl font-bold ml-8 mb-4">Your Proposal</h2>
        <form
          className="flex flex-col mt-2 w-full bg-gradient-to-b from-slate-900 to-slate-950  p-8 border border-slate-700 rounded-lg items-start"
          onSubmit={handleSubmit}
        >
          {address === '' && (
            <p className="mb-2">
              To be able to send a proposal, you must connect your wallet.
            </p>
          )}
          <fieldset className="mb-4 flex flex-col">
            <label className="font-bold mr-4" htmlFor="title">
              Title:
            </label>
            <input
              type="text"
              disabled={address === ''}
              name="title"
              className={`border-b border-slate-700 bg-slate-900 p-2 focus:border-slate-600 focus:outline-none focus:bg-slate-800 rounded-lg w-72 placeholder:text-slate-700 ${
                titleError !== '' && ' border border-red-500'
              }`}
              maxLength={30}
              placeholder="Stacks DeGrants Proposal"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
              required
            />
            {titleError !== '' && (
              <span className="text-red-500 text-xs pt-1">{titleError}</span>
            )}
          </fieldset>
          <fieldset className="mb-4 flex flex-col relative">
            <label className="font-bold mr-4" htmlFor="description">
              Description:
            </label>
            <textarea
              name="description"
              disabled={address === ''}
              className={`border-b border-slate-700 bg-slate-900 p-2 focus:border-slate-600 focus:outline-none focus:bg-slate-800 rounded-lg w-72 resize-none h-36 pb-4 placeholder:text-slate-700 ${
                descriptionError !== '' && ' border border-red-500'
              }`}
              maxLength={500}
              placeholder="I propose starting a descentralized grants program"
              onChange={(event) => setDescription(event.target.value)}
              required
            />
            {descriptionError !== '' && (
              <span className="text-red-500 text-xs pt-1">
                {descriptionError}
              </span>
            )}
            <span className="absolute bottom-0 right-0 text-xs ">
              {500 - description.length}/500
            </span>
          </fieldset>
          <fieldset className="mb-4 flex">
            <div className="flex flex-col mr-8">
              <label className="font-bold" htmlFor="milestones">
                Milestones:
              </label>
              <input
                type="number"
                className="border-b border-slate-700 bg-slate-900 p-2 focus:border-slate-600 focus:outline-none focus:bg-slate-800 rounded-lg w-32 placeholder:text-slate-700"
                disabled={address === ''}
                min={0}
                step={1}
                name="milestones"
                value={milestones}
                onChange={(event) => setMilestones(Number(event.target.value))}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-bold" htmlFor="milestones">
                Fund Per Milestone:
              </label>
              <div>
                <input
                  type="number"
                  name="fund-per-milestone"
                  disabled={address === ''}
                  min={0}
                  step={1}
                  className="border-b border-slate-700 bg-slate-900 p-2 focus:border-slate-600 focus:outline-none focus:bg-slate-800 rounded-lg w-32 placeholder:text-slate-700"
                  value={fundPerMilestone}
                  onChange={(event) =>
                    setFundPerMilestone(Number(event.target.value))
                  }
                />
                <span className="text-sm font-bold ml-1">STX</span>
              </div>
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={address === ''}
            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 hover:bg-slate-800 mt-4"
          >
            Submit Proposal
          </button>

          {generalError !== '' && (
            <p className="text-red-500 mt-4">{generalError}</p>
          )}
          {txId !== '' && (
            <p className="text-green-500 mt-4">
              Proposal submitted! Transaction ID: {txId}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Submit;
