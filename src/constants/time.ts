export function formatTimestamp(timestamp: number, opts?: Partial<{
    day: boolean;
    month: boolean;
    year: boolean;
    hour: boolean;
    minute: boolean;
    second: boolean;
}>): string {
    opts = Object.assign({
        day: true,
        month: true,
        year: true,
        hour: false,
        minute: false,
        second: false
    }, opts);
    const date = new Date(timestamp);

    const formated = date.toLocaleString("en-US", {
        timeZone: "UTC",
        day: opts.day ? "numeric" : undefined,
        month: opts.month ? "short" : undefined,
        year: opts.year ? "numeric" : undefined,
        hour: opts.hour ? "numeric" : undefined,
        minute: opts.minute ? "numeric" : undefined,
        second: opts.second ? "numeric" : undefined
    });

    return formated;
};

export function getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export function isCurrentMonth(timestamp: number): boolean {
    const date = new Date(timestamp);

    return date.getFullYear() === new Date().getFullYear() &&
        date.getMonth() === new Date().getMonth();
};

export function isToday(timestamp: number): boolean {
    const date = new Date(timestamp);

    return date.getFullYear() === new Date().getFullYear() &&
        date.getMonth() === new Date().getMonth() &&
        date.getDate() === new Date().getDate();
};