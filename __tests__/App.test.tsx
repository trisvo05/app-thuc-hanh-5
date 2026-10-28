/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Kiểm tra màn hình khi chưa cấu hình project, không tạo dữ liệu Firebase giả.
jest.mock('../src/services/firebase', () => ({firebaseConfigured: false}));
jest.mock('../src/services/authService', () => ({friendlyError: jest.fn(), logout: jest.fn(), subscribeAuth: jest.fn()}));
jest.mock('../src/services/userService', () => ({subscribeUser: jest.fn()}));
jest.mock('../src/services/presenceService', () => ({startPresence: jest.fn()}));
jest.mock('../src/navigation/RootNavigation', () => ({RootNavigation: jest.fn()}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
