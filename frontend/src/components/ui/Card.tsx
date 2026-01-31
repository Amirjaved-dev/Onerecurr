import { type ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function Card({ children, className = '', hoverEffect = true }: CardProps) {
    return (
        <div
            className={`
        glass-card rounded-2xl p-6 relative overflow-hidden group
        ${hoverEffect ? 'hover:shadow-2xl' : ''}
        ${className}
      `}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
