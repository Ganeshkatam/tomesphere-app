import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContestManagement from '@/components/admin/ContestManagement';
import '@testing-library/jest-dom';

// 1. Setup Mock Data
const MOCK_CONTESTS = [
    { id: '1', title: 'Test Contest AAA', status: 'active', start_date: '2025-01-01', prize_xp: 500, image_url: '' },
    { id: '2', title: 'Test Contest BBB', status: 'upcoming', start_date: '2025-02-01', prize_xp: 1000, image_url: '' }
];

// 2. We need to mock the module BEFORE import
// Using a factory to allow dynamic behavior if needed
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
                data: [
                    { id: '1', title: 'Test Contest AAA', status: 'active', start_date: '2025-01-01', prize_xp: 500, image_url: '' },
                    { id: '2', title: 'Test Contest BBB', status: 'upcoming', start_date: '2025-02-01', prize_xp: 1000, image_url: '' }
                ],
                error: null
            }),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null })
        }))
    }
}));

jest.mock('react-hot-toast', () => ({
    error: jest.fn(),
    success: jest.fn()
}));

jest.mock('@/components/admin/ContestForm', () => {
    return function MockContestForm({ onClose, onSuccess }: any) {
        return (
            <div data-testid="contest-form">
                <button onClick={onClose}>Close</button>
                <button onClick={onSuccess}>Save</button>
            </div>
        );
    };
});

describe('ContestManagement Component', () => {
    it('renders the contest list', async () => {
        render(<ContestManagement />);

        // Wait for loading to disappear
        await waitFor(() => {
            expect(screen.queryByText('Loading contests...')).not.toBeInTheDocument();
        });

        // Check for items
        expect(screen.getByText('Test Contest AAA')).toBeInTheDocument();
        expect(screen.getByText('Test Contest BBB')).toBeInTheDocument();
    });

    it('filters contests by search term', async () => {
        render(<ContestManagement />);
        await waitFor(() => expect(screen.queryByText('Loading contests...')).not.toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search contests...');

        // Search for 'AAA'
        fireEvent.change(searchInput, { target: { value: 'AAA' } });

        // AAA should be visible
        expect(screen.getByText('Test Contest AAA')).toBeInTheDocument();

        // BBB should be hidden (using queryByText)
        expect(screen.queryByText('Test Contest BBB')).not.toBeInTheDocument();
    });

    it('opens create form on click', async () => {
        render(<ContestManagement />);
        await waitFor(() => expect(screen.queryByText('Loading contests...')).not.toBeInTheDocument());

        const createButton = screen.getByText('Create Contest');
        fireEvent.click(createButton);

        expect(screen.getByTestId('contest-form')).toBeInTheDocument();
    });
});
