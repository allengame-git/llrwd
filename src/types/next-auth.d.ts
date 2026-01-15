import { DefaultSession } from "next-auth";
import { DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            username: string;
            isPM: boolean;
            isQC: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;
        role: string;
        username: string;
        isPM: boolean;
        isQC: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        username: string;
        isPM: boolean;
        isQC: boolean;
    }
}

