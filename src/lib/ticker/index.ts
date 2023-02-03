import EventEmitter from "node:events";

export default class Ticker extends EventEmitter {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private lastTick: number = 0;
    private interval: number;

    constructor(interval: number) {
        super();

        this.interval = interval;
    };

    start(resumed = false) {
        this.timer = setInterval(() => {
            this.emit("tick");
            this.lastTick = Date.now();
        }, this.interval);

        if (!resumed && !this.lastTick) {
            this.emit("tick");
            this.lastTick = Date.now();
        } else {
            const diff = Date.now() - this.lastTick;
            if (diff > this.interval) this.emit("tick");
        };
    };

    stop() {
        if (!this.timer) return;

        clearInterval(this.timer);
        this.timer = null;
    };

    resume() {
        if (this.timer) return;

        this.start(true);
    };
};