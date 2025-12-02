// src/context/AuthContext.jsx
// ------------------------------------------------------------
// AuthContext
//
// This React context holds global app state related to:
//
//   - The currently logged-in user
//   - That user's favorite dogs
//   - Global flash messages (success / error / info)
//
// Any component can access these via the `useAuth()` hook instead
// of having to pass props down multiple levels.
//
// Main values exposed:
//
//   - user           -> { username, email, zipcode, isAdmin } | null
//   - favorites      -> array of dog IDs (strings)
//   - setFavorites   -> setter for favorites (used by components)
//   - loginUser()    -> log in a user + load favorites + flash
//   - logoutUser()   -> log out + clear favorites + flash
//   - signupUser()   -> sign up a new user + flash
//   - addFlashMessage() -> helper to show flash from anywhere
//   - flash          -> current flash message { type, message } | null
//   - clearFlash()   -> clear the flash (used by FlashMessages component)
//   - setFlash       -> low-level setter in case you need custom control
// ------------------------------------------------------------

import { createContext, useContext, useState } from "react";
import { getFavorites, signup } from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // The logged-in user object, or null if no one is logged in.
  const [user, setUser] = useState(null);

  // List of favorite dog IDs for the current user.
  // Example: ["123", "456", "789"]
  const [favorites, setFavorites] = useState([]);

  // Global flash message used across the app.
  // Example: { type: "success", message: "Logged in!" }
  const [flash, setFlash] = useState(null);

  // ------------------------------------------------------------
  // loginUser
  //
  // Called after a successful login. It:
  //   - Saves the user in context
  //   - Triggers a success flash message
  //   - Asynchronously loads the user's favorites from the backend
  // ------------------------------------------------------------
  function loginUser(userData) {
    setUser(userData);

    setFlash({
      type: "success",
      message: `${userData.username} is logged in.`,
    });

    // Fire-and-forget: we don't block the UI waiting for favorites.
    (async function loadUserFavorites() {
      try {
        const favs = await getFavorites(userData.username);
        // expecting `favs` to be an array of dog IDs
        setFavorites(favs || []);
      } catch (err) {
        console.error("Error loading favorites for user:", err);
        // Optional: you could set a flash error here too if you wanted.
      }
    })();
  }

  // ------------------------------------------------------------
  // signupUser
  //
  // Called when a user signs up from the signup form.
  // It:
  //   - Sends the signup request to the backend
  //   - Saves the returned user in context
  //   - Clears favorites (new account = no favorites yet)
  //   - Shows a friendly welcome flash message
  // ------------------------------------------------------------
  async function signupUser(userData) {
    // signup() comes from ../api and should return a user object.
    const newUser = await signup(userData);

    // Set user in context
    setUser(newUser);

    // New users start with no favorites
    setFavorites([]);

    // Flash message
    setFlash({
      type: "success",
      message: `Welcome, ${newUser.username}! Account created successfully.`,
    });
  }

  // ------------------------------------------------------------
  // addFlashMessage
  //
  // Small helper to trigger a flash message anywhere in the app.
  //
  // Example:
  //   const { addFlashMessage } = useAuth();
  //   addFlashMessage("Something went wrong", "error");
  // ------------------------------------------------------------
  function addFlashMessage(message, type = "info") {
    setFlash({ type, message });
  }

  // ------------------------------------------------------------
  // logoutUser
  //
  // Clears user + favorites and shows a flash message.
  // ------------------------------------------------------------
  function logoutUser() {
    const name = user?.username || "User";

    setUser(null);
    setFavorites([]); // clear favorites on logout

    setFlash({
      type: "info",
      message: `${name} has been logged out.`,
    });
  }

  // ------------------------------------------------------------
  // clearFlash
  //
  // Used by the FlashMessages component (and can be used elsewhere)
  // to manually dismiss the current flash message.
  // ------------------------------------------------------------
  function clearFlash() {
    setFlash(null);
  }

  // ------------------------------------------------------------
  // Provider
  // ------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        favorites,
        setFavorites,
        loginUser,
        logoutUser,
        signupUser,
        addFlashMessage,
        flash,
        clearFlash,
        setFlash, // exposed for maximum flexibility
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components can easily use:
//
//   const { user, loginUser, logoutUser } = useAuth();
//
export function useAuth() {
  return useContext(AuthContext);
}








// ===== before comments =======
// // src/context/AuthContext.jsx
// import { createContext, useContext, useState } from "react";
// import { getFavorites, signup } from "../api";


// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [favorites, setFavorites] = useState([]); // array of dog IDs
//   const [flash, setFlash] = useState(null);

//   function loginUser(userData) {
//     setUser(userData);
//     setFlash({
//       type: "success",
//       message: `${userData.username} is logged in.`,
//     });

//     // Fire-and-forget load of this user's favorites
//     (async function loadUserFavorites() {
//       try {
//         const favs = await getFavorites(userData.username);
//         // expecting favs to be an array of dog IDs
//         setFavorites(favs || []);
//       } catch (err) {
//         console.error("Error loading favorites for user:", err);
//       }
//     })();
//   }

//   async function signupUser(userData) {
//   // signup() comes from ../api
//   const newUser = await signup(userData);

//   // Set user in context
//   setUser(newUser);

//   // Immediately load favorites (should be empty at signup)
//   setFavorites([]);

//   // Flash message
//   setFlash({
//     type: "success",
//     message: `Welcome, ${newUser.username}! Account created successfully.`,
//   });
// }

// function addFlashMessage(message, type = "info") {
//   setFlash({ type, message });
// }


//   function logoutUser() {
//     const name = user?.username || "User";
//     setUser(null);
//     setFavorites([]); // clear favorites on logout
//     setFlash({
//       type: "info",
//       message: `${name} has been logged out.`,
//     });
//   }

//   function clearFlash() {
//     setFlash(null);
//   }

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         favorites,
//         setFavorites,
//         loginUser,
//         logoutUser,
//         signupUser,  
//         addFlashMessage,
//         flash,
//         clearFlash,
//         setFlash,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }
