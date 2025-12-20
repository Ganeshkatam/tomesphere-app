import React from 'react'
import { render, screen } from '@testing-library/react'
import LandingPage from '../app/page'

// Mock the next/navigation modules
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
        };
    },
    useSearchParams() {
        return {
            get: jest.fn(),
        };
    },
}));

// Mock next/dynamic
jest.mock('next/dynamic', () => () => {
    const DynamicComponent = () => null;
    DynamicComponent.displayName = 'LoadableComponent';
    return DynamicComponent;
});

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
    Toaster: () => null,
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
            getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
    },
}));

// Mock child components to avoid dynamic loading issues
jest.mock('@/components/AuthGateModal', () => function AuthGateModal() { return <div data-testid="auth-gate">Auth Modal</div> });
jest.mock('@/components/SocialShowcase', () => function SocialShowcase() { return <div data-testid="social-showcase">Social Showcase</div> });
jest.mock('@/components/StudentSection', () => function StudentSection() { return <div data-testid="student-section">Student Section</div> });
jest.mock('@/components/VoiceInput', () => function VoiceInput() { return <div data-testid="voice-input">Voice Input</div> });

// Mock Framer Motion components
jest.mock('@/components/ui/motion', () => ({
    FadeIn: ({ children }: any) => <div>{children}</div>,
    SlideUp: ({ children }: any) => <div>{children}</div>,
    ScaleIn: ({ children }: any) => <div>{children}</div>,
    StaggerContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock LandingClient
jest.mock('../app/LandingClient', () => {
    return function LandingClient() {
        return (
            <div>
                <h1>TomeSphere</h1>
                <button>Get Started</button>
            </div>
        );
    };
});

describe('Landing Page', () => {
    it('renders the LandingClient component', () => {
        render(<LandingPage />)

        // Check for the mocked content
        expect(screen.getByText('TomeSphere')).toBeInTheDocument()
        expect(screen.getByText('Get Started')).toBeInTheDocument()
    })
})
