import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./auth-client.js";
import { Login } from "./pages/Login.js";
import { Projects } from "./pages/Projects.js";
import { ProjectDetail } from "./pages/ProjectDetail.js";
import "./styles.css";

function Protected({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();
  if (isPending)
    return (
      <p className="p-6 text-sm text-muted-foreground">Loading…</p>
    );
  if (!data) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Projects />
            </Protected>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Protected>
              <ProjectDetail />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
