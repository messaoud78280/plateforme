import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Une seule lecture session par requête RSC (layout + pages). */
export const getCachedServerSession = cache(async () => getServerSession(authOptions));
