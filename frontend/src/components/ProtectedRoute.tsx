import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to restore from localStorage
  if (loading) return null;

  // Not logged in → go to home
  if (!isLoggedIn) return <Navigate to="/" state={{ from: location }} replace />;

  // Role not allowed → unauthorized
  if (!user || !allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}