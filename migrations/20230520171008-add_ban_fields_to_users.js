module.exports = {
    async up(db, client) {
        const users = await db.collection("users");

        await users.updateMany({}, {
            $set: {
                banNotified: false
            }
        });
    },

    async down(db, client) {
        const users = await db.collection("users");

        await users.updateMany({}, {
            $unset: {
                banNotified: 1
            }
        });
    }
};