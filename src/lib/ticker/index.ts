import EventEmitter from "node:events";

export default class Ticker extends EventEmitter implements TickerI {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private interval: number;

    constructor(interval: number) {
        super();

        this.interval = interval;
    };

    start() {
        this.timer = setInterval(() => this.emit("tick"), this.interval);
        this.emit("tick");
    };

    stop() {
        if (!this.timer) return;

        clearInterval(this.timer);
    };
};

interface TickerI {
    start(): void;
    stop(): void;
};