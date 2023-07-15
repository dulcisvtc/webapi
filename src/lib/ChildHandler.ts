import { fork } from "child_process";

export default class ChildHandler<T = any> {
    path: string;

    constructor(path: string) {
        this.path = path;
    };

    public async getData(): Promise<T> {
        const child = fork(this.path);

        return new Promise((resolve, reject) => {
            child.on("message", (data: T) => {
                resolve(data);
            });

            child.on("error", (error: Error) => {
                reject(error);
            });
        });
    };

    public async run(): Promise<void> {
        const child = fork(this.path);

        return new Promise((resolve, reject) => {
            child.on("exit", (code: number) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Child process exited with code ${code}`));
                };
            });

            child.on("error", (error: Error) => {
                reject(error);
            });
        });
    };
};