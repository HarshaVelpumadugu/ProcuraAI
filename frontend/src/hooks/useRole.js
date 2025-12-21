import { useAuth } from "./useAuth";

export const useRole = () => {
  const { user } = useAuth();

  const isBuyer = user?.role === "buyer" || user?.role === "admin";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  return {
    role: user?.role,
    isBuyer,
    isVendor,
    isAdmin,
  };
};
