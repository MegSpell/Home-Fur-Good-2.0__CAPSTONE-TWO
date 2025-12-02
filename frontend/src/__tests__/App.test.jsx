// src/__tests__/App.test.jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// --- Mock AuthContext so we can control user / admin state ---
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "../context/AuthContext";

// --- Mock FlashMessages (we don't care about its internals here) ---
jest.mock("../components/FlashMessages.jsx", () => () => (
  <div data-testid="flash-messages" />
));

// --- Mock page components so App tests just routing/layout ---
// NOTE: These paths must match the *real* files App imports,
// but adjusted relative to this test file (../pages/...)
jest.mock("../pages/Home.jsx", () => () => <div>Home Page</div>);
jest.mock("../pages/Welcome.jsx", () => () => <div>Welcome Page</div>);
jest.mock("../pages/Search.jsx", () => () => <div>Search Page</div>);
jest.mock("../pages/SearchResults.jsx", () => () => (
  <div>Search Results Page</div>
));
jest.mock("../pages/DogDetail.jsx", () => () => <div>Dog Detail Page</div>);
jest.mock("../pages/Login.jsx", () => () => <div>Login Page</div>);
jest.mock("../pages/Signup.jsx", () => () => <div>Signup Page</div>);
jest.mock("../pages/Favorites.jsx", () => () => <div>Favorites Page</div>);
jest.mock("../pages/Admin.jsx", () => () => <div>Admin Page</div>);
jest.mock("../pages/Profile.jsx", () => () => <div>Profile Page</div>);
jest.mock("../pages/AdminEditUser.jsx", () => () => (
  <div>Admin Edit User Page</div>
));
jest.mock("../pages/About.jsx", () => () => <div>About Page</div>);

// Import App *after* mocks so it uses them
import App from "../App.jsx";

describe("App routing & layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockAuth(value) {
    useAuth.mockReturnValue({
      // sensible defaults
      user: null,
      currentUser: null,
      logoutUser: jest.fn(),
      setFlash: jest.fn(),
      ...value,
    });
  }

  test("renders Home route when at '/' and user is logged out", () => {
    mockAuth({ user: null, currentUser: null });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    // Our mocked Home component
    expect(screen.getByText("Home Page")).toBeInTheDocument();
    // And we should *not* see a protected page
    expect(screen.queryByText("Welcome Page")).not.toBeInTheDocument();
  });

  test("redirects logged-out user from protected /welcome back to Home", async () => {
    mockAuth({ user: null, currentUser: null });

    render(
      <MemoryRouter initialEntries={["/welcome"]}>
        <App />
      </MemoryRouter>
    );

    // Because RequireAuth redirects to "/", we should end up on Home
    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Welcome Page")).not.toBeInTheDocument();
  });

  test("shows protected Welcome route for logged-in user", () => {
    mockAuth({
      user: { username: "meg", isAdmin: false },
    });

    render(
      <MemoryRouter initialEntries={["/welcome"]}>
        <App />
      </MemoryRouter>
    );

    // Now the protected route should render
    expect(screen.getByText("Welcome Page")).toBeInTheDocument();
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
  });

  test("shows NotFound page for unknown route", () => {
    mockAuth({ user: null });

    render(
      <MemoryRouter initialEntries={["/this-route-does-not-exist"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument();
  });

  test("shows ADMIN MODE badge in header when user is admin", () => {
    mockAuth({
      user: { username: "admin", isAdmin: true },
    });

    render(
      <MemoryRouter initialEntries={["/welcome"]}>
        <App />
      </MemoryRouter>
    );

    // Layout should detect admin and show badge
    expect(screen.getByText(/admin mode/i)).toBeInTheDocument();
    // Protected route still renders too
    expect(screen.getByText("Welcome Page")).toBeInTheDocument();
  });
});
