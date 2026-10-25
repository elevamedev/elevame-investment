import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import OfflineQueryProvider from "./lib/OfflineQueryProvider.jsx";
import "./index.css";

// TanStack Query's offline persistence is keyed to the signed-in
// user (brief 4.12), so it has to sit inside AuthProvider to read
// the current user id.
function QueryBootstrap({ children }) {
  const { user } = useAuth();
  return <OfflineQueryProvider userId={user?.id}>{children}</OfflineQueryProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <QueryBootstrap>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </QueryBootstrap>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
