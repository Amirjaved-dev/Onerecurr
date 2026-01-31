interface BadgeProps {
    status: 'success' | 'warning' | 'error' | 'neutral';
    text: string;
    pulse?: boolean;
}

export function Badge({ status, text, pulse = false }: BadgeProps) {
    const styles = {
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        neutral: "bg-gray-700/30 text-gray-400 border-gray-700/50",
    };

    const indicatorColors = {
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-red-500",
        neutral: "bg-gray-500",
    };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${styles[status]}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${indicatorColors[status]} ${pulse ? 'animate-pulse' : ''}`} />
            {text}
        </div>
    );
}
