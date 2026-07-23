import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Layout, { Loading } from "./components/Layout.jsx";
import OnboardingGate from "./components/OnboardingGate.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./pages/AuthPages.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import StudyPage from "./pages/StudyPage.jsx";
import FitnessPage from "./pages/FitnessPage.jsx";
import GamesPage from "./pages/GamesPage.jsx";
import RewardsPage from "./pages/RewardsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

function Protected() {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <Loading />;

  return currentUser
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function PublicOnly() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return <Loading />;

  return currentUser ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<Protected />}>
        <Route element={<OnboardingGate />}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/fitness" element={<FitnessPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/reward-room" element={<InventoryPage />} />
            <Route path="/inventory" element={<Navigate to="/reward-room" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
