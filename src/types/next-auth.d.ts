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
      image?: string | null;
      isDemo?: boolean;
      demoEnvironmentId?: string;
      demoCompanyName?: string;
      demoModules?: string[];
      demoExpired?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    contractStatus?: string;
    accountStatus?: string;
    email?: string;
    isDemo?: boolean;
    demoEnvironmentId?: string;
    demoCompanyName?: string;
    demoModules?: string[];
    demoExpired?: boolean;
  }
}
