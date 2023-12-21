import React from 'react';
import { Link } from 'react-router-dom';
import { truncateAddress } from '../../lib/utils';

export const Nav = ({ disconnectWallet, connectWallet, address }) => {
  console.log({ address });
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-32 lg:h-16 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800">
        <nav className="w-full h-full flex flex-col lg:flex-row items-center space-between px-4 pb-4 lg:px-8 lg:pb-0">
          <ul className="flex items-center h-full gap-4 flex-grow">
            <li className="hover:text-slate-100">
              <Link className="mono text-lg mr-4" to="/">
                DE_GRANTS_
              </Link>
            </li>
            <li className="hover:text-slate-100">
              <a href="/about">About</a>
            </li>
            <li className="hover:text-slate-100">
              <a href="/proposals">Proposals</a>
            </li>
            <li className="hover:text-slate-100">
              <a href="/projects">Projects</a>
            </li>

            <li className="hover:text-slate-100">
              <a href="/submit">Submit Proposal</a>
            </li>
          </ul>
          <div className="flex gap-4 items-center">
            {address.length > 0 ? (
              <button
                onClick={disconnectWallet}
                className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 hover:bg-slate-800"
              >
                Disconnect Wallet
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 hover:bg-slate-800"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </nav>
      </div>
      {address && (
        <span className="absolute top-32 lg:top-16 right-10 text-xs pt-2">
          connected as: {truncateAddress(address)}
        </span>
      )}
    </>
  );
};
