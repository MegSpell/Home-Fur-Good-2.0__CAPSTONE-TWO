// src/__tests__/Home.test.jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../pages/Home";

// 🔹 Hard-mock AuthContext so it DOESN'T import ../api
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Get the mocked useAuth
import { useAuth } from "../context/AuthContext";

// 🔹 Mock the logo asset so Jest doesn't try to read the actual file
jest.mock("../assets/HFG2-logo.png", () => "logo-mock.png");

// Small helper to render Home inside a router
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe("Home page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shows Login + Signup buttons when user is NOT logged in", () => {
    // no active user
    useAuth.mockReturnValue({ user: null, currentUser: null });

    renderHome();

    // Logo
    expect(
      screen.getByAltText(/home fur good 2\.0 logo/i)
    ).toBeInTheDocument();

    // Auth links
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();

    // No "Start searching dogs" link
    expect(
      screen.queryByRole("link", { name: /start searching dogs/i })
    ).not.toBeInTheDocument();
  });

  test("shows 'Start searching dogs' when user IS logged in", () => {
    useAuth.mockReturnValue({
      user: { username: "meg" },
      currentUser: null,
    });

    renderHome();

    expect(
      screen.getByRole("link", { name: /start searching dogs/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: /log in/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /sign up/i })
    ).not.toBeInTheDocument();
  });
});
