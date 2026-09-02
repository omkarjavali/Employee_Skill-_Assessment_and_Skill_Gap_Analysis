import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Assessments from "./pages/Assessments";
import Assessment from "./pages/Assessment";
import SkillGapOverview from "./pages/SkillGapOverview";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import ReviewAnswer from "./pages/ReviewAnswer";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUserPerformance from "./pages/AdminUserPerformance";


function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =====================================================
            PROTECTED APPLICATION
        ===================================================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<Layout />}>


            {/* =================================================
                EMPLOYEE ROUTES
            ================================================= */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />


            <Route
              path="/assessments"
              element={<Assessments />}
            />


            <Route
              path="/assessment/:assessmentId"
              element={<Assessment />}
            />


            <Route
              path="/skill-gap"
              element={<SkillGapOverview />}
            />


            <Route
              path="/skill-gap/:assessmentId"
              element={<SkillGapAnalysis />}
            />


            <Route
              path="/assessment/:assessmentId/review"
              element={<ReviewAnswer />}
            />


            {/* =================================================
                ADMIN ROUTES
            ================================================= */}

            <Route element={<AdminRoute />}>

              <Route
                path="/admin"
                element={<AdminDashboard />}
              />


              <Route
                path="/admin/users/:userId"
                element={
                  <AdminUserPerformance />
                }
              />

            </Route>


          </Route>

        </Route>


      </Routes>

    </BrowserRouter>

  );

}


export default App;