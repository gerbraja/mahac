import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnilevelDashboard from './UnilevelDashboard';

// Mock the service
jest.mock('./CommissionService', () => ({
  calculateCommissions: jest.fn(() => Promise.resolve([
    { id: 1, user_id: 1, type: 'unilevel', level: 1, commission_amount: 5.0, sale_amount: 100.0 }
  ]))
}));

describe('UnilevelDashboard', () => {
  test('renders and calculates commissions', async () => {
    render(<UnilevelDashboard />);

    const sellerInput = screen.getByLabelText(/Seller ID/i);
    const amountInput = screen.getByLabelText(/Sale amount/i);
    const button = screen.getByRole('button', { name: /Calculate commissions/i });

    fireEvent.change(sellerInput, { target: { value: '2' } });
    fireEvent.change(amountInput, { target: { value: '100' } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/User ID/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5.00')).toBeInTheDocument();
    });
  });
});
