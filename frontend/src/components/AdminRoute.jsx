import {
  Navigate,
  Outlet
} from "react-router-dom";


function AdminRoute() {

  const token =
    localStorage.getItem(
      "access_token"
    );

  const storedUser =
    localStorage.getItem(
      "user"
    );


  // =========================================================
  // NO TOKEN
  // =========================================================

  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // =========================================================
  // GET USER
  // =========================================================

  let user = null;

  try {

    user =
      storedUser
        ? JSON.parse(storedUser)
        : null;

  } catch (error) {

    console.error(
      "Failed to parse stored user:",
      error
    );

    localStorage.removeItem(
      "user"
    );

  }


  // =========================================================
  // NOT ADMIN
  // =========================================================

  if (
    !user ||
    user.role?.toUpperCase() !== "ADMIN"
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  // =========================================================
  // ADMIN
  // =========================================================

  return <Outlet />;

}


export default AdminRoute;