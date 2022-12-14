export interface MeResponse {
    ok: boolean;
    data: {
        id: number;
        global_id: string | null;
        name: string;
        logo_url: string;
        discord_rpc: {
            eut2_app_id: number | null;
            ats_app_id: number | null;
        };
    } | unknown;
};

export interface PostDriver {
    id: number;
    steam_id: string;
    truckspace_id: string | null;
    username: string;
    profile_photo_url: string;
    client: {
        is_installed: boolean;
        version: {
            name: string;
            branch_name: "Public" | "Beta";
            is_latest: boolean;
        };
    };
    is_banned: boolean;
    last_active: string;
};