import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      contractStatus?: string;
      accountStatus?: string;
      personType?: string | null;
      permissionProfile?: string | null;
      image?: string | null;
      isDemo?: boolean;
      demoEnvironmentId?: string;
      demoCompanyName?: string;
      demoModules?: string[];
      demoExpired?: boolean;
      /** Root Direction (Denis) — pour revenir de « Voir comme… ». */
      demoRootUserId?: string;
      demoViewAs?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    contractStatus?: string;
    accountStatus?: string;
    personType?: string | null;
    permissionProfile?: string | null;
    mustChangePassword?: boolean;
    email?: string;
    isDemo?: boolean;
    demoEnvironmentId?: string;
    demoCompanyName?: string;
    demoModules?: string[];
    demoExpired?: boolean;
    demoRootUserId?: string;
    demoViewAs?: string | null;
  }
}
