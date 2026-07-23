import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { loadUserProfile } from "../services/userService.js";
import { Loading } from "./Layout.jsx";

export default function OnboardingGate() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [domain, setDomain] = useState(undefined);

  useEffect(() => {
    let active = true;
    loadUserProfile(currentUser.uid)
      .then((profile) => {
        if (active) setDomain(profile.startDomain || null);
      })
      .catch(() => {
        if (active) setDomain(null);
      });

    return () => {
      active = false;
    };
  }, [currentUser.uid, location.pathname]);

  if (domain === undefined) return <Loading text="טוענים את המסלול..." />;

  if (!domain && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (domain && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
