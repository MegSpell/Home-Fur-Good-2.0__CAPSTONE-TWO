// src/main.jsx
// ======================================================================
// ENTRY POINT of your React app
//
// This is the FIRST piece of code that runs in the browser.
// It mounts your <App /> component into the real HTML page
// (the <div id="root"></div> found in index.html)
//
// It also wraps your entire app with:
//   • <BrowserRouter> → enables React Router URLs + navigation
//   • <AuthProvider>  → provides global login/user state
// ======================================================================

import React from "react";
import ReactDOM from "react-dom/client";  // modern React root renderer
import { BrowserRouter } from "react-router-dom";  // needed for routing

// Your main application component
import App from "./App.jsx";

// Global CSS for the whole app
import "./index.css";

// Global authentication context provider
import { AuthProvider } from "./context/AuthContext.jsx";


// ======================================================================
// CREATE THE ROOT + RENDER THE APP
//
// ReactDOM.createRoot(...) tells React:
// “Attach the whole React app to this real DOM element.”
//   → That DOM element is <div id="root"></div> in index.html
//
// Inside render():
//   • <React.StrictMode> helps catch errors in development.
//   • <BrowserRouter> enables navigation + URLs.
//   • <AuthProvider> wraps the app so all components
//       can access user + favorites + flash messages.
//
// Think of these wrappers like "global settings" that
// your entire app depends on.
// ======================================================================

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    {/* Enables us to use <Routes />, <Link />, useNavigate(), etc. */}
    <BrowserRouter>

      {/* Provides global auth + favorites state to the whole app */}
      <AuthProvider>

        {/* Your actual application with all routes/pages */}
        <App />

      </AuthProvider>
    </BrowserRouter>

  </React.StrictMode>
);


