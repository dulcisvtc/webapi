import { inspect } from "util";
import { Session, connection } from "../database";

(async () => {
    try {
        await connection;

        await Session.deleteMany({ expiresAt: { $lte: Date.now() } });

        process.exit();
    } catch (err) {
        throw new Error(`MetricsChild: ${inspect(err)}`);
    };
})();