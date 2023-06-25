export const Flags = {
    Access: 1 << 0,
    ManageEvents: 1 << 1,
    ManageUsers: 1 << 2
};

type PermissionFlags = keyof typeof Flags;
export type PermissionResolvable =
    number |
    number[] |
    PermissionFlags |
    PermissionFlags[] |
    Permissions |
    Permissions[];

export default class Permissions {
    static Flags = Flags;

    static DefaultBit = 0;

    bitfield: number;

    constructor(bits = 0) {
        this.bitfield = bits;
    };

    has(bit: PermissionResolvable) {
        bit = Permissions.resolve(bit);

        return (this.bitfield & bit) === bit;
    };

    toArray(): PermissionFlags[] {
        return Object.keys(Permissions.Flags).filter(bit => this.has(bit as PermissionFlags)) as PermissionFlags[];
    }

    static resolve(bit: PermissionResolvable): number {
        const { DefaultBit } = this;

        if (typeof bit === "number" && bit >= DefaultBit) return bit;
        if (bit instanceof Permissions) return bit.bitfield;
        if (Array.isArray(bit)) return bit.map(p => this.resolve(p)).reduce((prev, p) => prev | p, DefaultBit);
        if (typeof bit === "string") {
            if (typeof this.Flags[bit] !== "undefined") return this.Flags[bit];
            if (!isNaN(parseInt(bit))) return Number(bit);
        };

        return 0;
    };
};