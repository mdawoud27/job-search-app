// node --env-file=.env scripts/socket-smoke-test.js
/* eslint no-console: 0 */
/* eslint no-undef: 0 */

import { io } from 'socket.io-client';

const HR_TOKEN = 'paste_hr_token_here';
const USER_TOKEN = 'paste_user_token_here';
const COMPANY_ID = 'paste_company_id_here';
const SERVER = 'http://localhost:3000';

function connect(token, label) {
  return new Promise((resolve) => {
    const socket = io(SERVER, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () =>
      console.log(`✅ [${label}] connected: ${socket.id}`),
    );
    socket.on('connect_error', (e) =>
      console.error(`❌ [${label}] error: ${e.message}`),
    );
    socket.on('error', (e) =>
      console.error(`❌ [${label}] server error: ${e.message}`),
    );

    socket.on('connect', () => resolve(socket));
  });
}

const hrSocket = await connect(HR_TOKEN, 'HR');
const userSocket = await connect(USER_TOKEN, 'User');

// Test joinCompany
hrSocket.emit('joinCompany', COMPANY_ID);
hrSocket.on('joinCompanySuccess', ({ companyId }) => {
  console.log(`✅ [HR] joined company room: ${companyId}`);
});

// Test chat
const HR_ID = '<hr_user_id>';
// const USER_ID = '<user_id>';

userSocket.emit('sendMessage', {
  receiverId: HR_ID,
  message: 'Hello from smoke test!',
});

hrSocket.on('receiveMessage', (data) => {
  console.log('✅ [HR] received message:', data.message);
  process.exit(0);
});

setTimeout(() => {
  console.error('❌ Timeout — no message received after 5s');
  process.exit(1);
}, 5000);
