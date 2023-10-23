module.exports = {
    async up(db, client) {
        const users = await db.collection("users");

        await users.updateMany({
            warns: { $exists: true }
        }, {
            $unset: { warns: 1 }
        });
    },

    async down(db, client) {
        const users = await db.collection("users");

        await users.updateMany({
            experience: { $exists: false }
        }, {
            $set: { warns: {} }
        });
    }
};