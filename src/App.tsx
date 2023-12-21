import React, { ReactElement, useEffect, useState } from 'react';
import {
  AppConfig,
  FinishedAuthData,
  showConnect,
  UserSession
} from '@stacks/connect';

import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Nav } from './components/ui/nav';

function App(): ReactElement {
  const [address, setAddress] = useState('');

  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const userSession = new UserSession({ appConfig });

  const proposals = [
    {
      id: 1,
      title: 'Proposal 1',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl quis ultricies ultricies, nunc nisl ultricies nisl, quis ultricies nisl nisl quis nisl.',
      total: 1000
    },
    {
      id: 2,
      title: 'Proposal 2',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl quis ultricies ultricies, nunc nisl ultricies nisl, quis ultricies nisl nisl quis nisl.',
      total: 2000
    },
    {
      id: 3,
      title: 'Proposal 3',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl quis ultricies ultricies, nunc nisl ultricies nisl, quis ultricies nisl nisl quis nisl.',
      total: 2000
    },
    {
      id: 4,
      title: 'Proposal 4',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl quis ultricies ultricies, nunc nisl ultricies nisl, quis ultricies nisl nisl quis nisl.',
      total: 1000
    },
    {
      id: 5,
      title: 'Proposal 5',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl quis ultricies ultricies, nunc nisl ultricies nisl, quis ultricies nisl nisl quis nisl.',
      total: 2000
    },
    {
      id: 6,
      title: 'Proposal 6',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod, nisl quis ultricies ultricies, nunc nisl ultricies nisl, quis ultricies nisl nisl quis nisl.',
      total: 2000
    }
  ];

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
            Welcome to DeGrants
          </h1>
          <p className="leading-normal text-muted-foreground">
            The Stacks Descentralized Grants Program. Connect your wallet and
            have a look at the latest proposals, vote for your favorites and
            submit your own.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 mt-8">
        <h2 className="text-center text-lg font-bold mb-4">Latest Proposals</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
          {proposals.map(({ id, title, description, total }) => (
            <div className="rounded-lg bg-gradient-to-b from-slate-900 to-slate-800 p-4 border border-slate-800">
              <h3 className="font-bold mb">{title}</h3>
              <p>{description}</p>
              <div className="flex justify-between items-center border-t mt-2 border-slate-700">
                <p>
                  <strong>Requested:</strong> {total}STX
                </p>
                <Link
                  className="hover:underline flex items-center"
                  to={`/proposals/${id}`}
                >
                  View Details <ArrowRight className="ml-1" size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
