import { type PropsWithChildren } from 'react';

export default function PricingLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="mx-auto max-w-7xl px-4 py-8">
                {children}
            </div>
        </div>
    );
}