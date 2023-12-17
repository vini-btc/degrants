import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });
const challengeMessage = 'Hiro Hacks Fun 2023';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error('Authentication token was not found');
}

app.use(cors());

io.on('connection', async (socket) => {
  socket.on('disconnect', (data) => {
    console.log('user disconnected', data);
  });
  socket.on('message', (message) => {
    console.log('message', message);
  });
});

io.on('error', (err) => {
  console.log('SocketIO Error: ', err);
});

app.post('/listen/proposal', (req, res) => {
  const authorization = req.headers.authorization;
  const body = req.body;
  console.log({ authorization, body });
  return res.status(200).send('OK');
});

app.get('/challenge', (req, res) => {
  return res.status(200).send(challengeMessage);
});

server.listen(3010, () => {
  console.log('listening on *:3010');
});
