import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import fetch from 'cross-fetch';
import { Configuration, TransactionsApi } from '@stacks/blockchain-api-client';
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '@stacks/stacks-blockchain-api-types';

const app = express();
const server = http.createServer(app);

const challengeMessage = 'Hiro Hacks Fun 2023';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!AUTH_TOKEN) {
  throw new Error('Authentication token was not found');
}

if (!SUPABASE_KEY) {
  throw new Error('Supabase key was not found');
}

const supabaseUrl = 'https://slfwqpuahnwjjtjjyyej.supabase.co';
const supabase = createClient(supabaseUrl, SUPABASE_KEY);

app.use(cors());
app.use(express.json());

app.post('/listen/proposal/update', (req, res) => {
  const authorization = req.headers.authorization;
  console.log({ authorization, body: req.body });
  const events = req.body;
  // Loop through each item in the apply array
  events.apply.forEach((item: any) => {
    // Loop through each transaction in the item
    item.transactions.forEach((transaction: any) => {
      // If the transaction has operations, loop through them
      if (transaction.operations) {
        transaction.operations.forEach((operation: any) => {
          // Log the operation
          console.log({ operation });
        });
      }
    });

    // @TODO: Update the status of the proposal in the database
  return res.status(200).send('OK');
});

app.post('/listen/proposal/new', async (req, res) => {
  const {
    contractName,
    title,
    description,
    milestones,
    fundPerMilestone,
    proposer,
    txId
  } = req.body;
  const { data, error } = await supabase
    .from('proposal')
    .insert([
      {
        title,
        description,
        milestones,
        proposer,
        status: 'mempool',
        ['contract-name']: contractName,
        ['fund-per-milestones']: fundPerMilestone,
        ['genesis-transaction']: txId
      }
    ])
    .select();

  if (error) {
    console.error(error);
    return res.status(500).send('Error');
  }
  console.log('inserted', data);
  return res.status(200).send('OK');
});

app.get('/api/proposals', async (req, res) => {
  const proposer = req.query.address;
  if (!proposer) {
    return res.status(400).send('Missing address');
  }
  const { data, error } = await supabase
    .from('proposal')
    .select('*')
    .eq('proposer', proposer);

  if (error) {
    console.error(error);
    return res.status(500).send('Error');
  }

  return res.status(200).send(data);
});

app.post('/api/proposals/refresh-transaction', async (req, res) => {
  const { txId } = req.body;
  if (!txId) {
    return res.status(400).send('Missing txId');
  }
  const apiConfig: Configuration = new Configuration({
    fetchApi: fetch,
    basePath: 'https://api.testnet.hiro.so'
  });

  const transactionApi = new TransactionsApi(apiConfig);

  const response = await transactionApi.getTransactionById({
    txId
  });

  if ((response as Transaction).tx_status === 'success') {
    const { data, error } = await supabase
      .from('proposal')
      .update({ status: 'confirmed' })
      .eq('genesis-transaction', txId);

    if (error) {
      console.error(error);
      return res.status(500).send('Error');
    }
    console.log('updated', data);
    return res.status(200).send('OK');
  }

  if (
    (response as Transaction).tx_status === 'abort_by_response' ||
    (response as Transaction).tx_status === 'abort_by_post_condition'
  ) {
    const { error } = await supabase
      .from('proposal')
      .update({ status: 'aborted' })
      .eq('genesis-transaction', txId);

    if (error) {
      console.error(error);
      return res.status(500).send('Error');
    }

    return res.status(200).send('OK');
  }
});

app.get('/challenge', (_, res) => {
  return res.status(200).send(challengeMessage);
});

server.listen(3010, () => {
  console.log('listening on *:3010');
});
