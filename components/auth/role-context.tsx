"use client";

import { createContext, useContext } from "react";
import type { Role } from "@prisma/client";

type RoleContextValue = { role: Role; isAdmin: boolean };

// Fail closed: components rendered outside the provider read as USER.
const RoleContext = createContext<RoleContextValue>({ role: "USER", isAdmin: false });

/**
 * Exposes the *effective* role to client components so the UI can hide
 * admin-only actions (device/automation/alert-rule/API-key creation, token
 * regeneration). An admin "viewing as user" reads as USER here — the real
 * authorization check stays server-side in the API routes.
 */
export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={{ role, isAdmin: role === "ADMIN" }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
