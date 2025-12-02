// src/__tests__/Login.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

// --- Mocks --------------------------------------------------

// Mock the API login call so we don't hit the real backend
const mockApiLogin = jest.fn();

jest.mock("../api", () => ({
  // make the named export `login` call our mock
  login: (...args) => mockApiLogin(...args),
}));

// Mock AuthContext so we control loginUser
const mockAuthLoginUser = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    // Login page only needs loginUser here
    loginUser: mockAuthLoginUser,
  }),
}));

// Helper to render Login inside a router (so useNavigate/useLocation work)
function renderLogin(initialPath = "/login", routeState) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state: routeState }]}>
      <Login />
    </MemoryRouter>
  );
}

// --- Tests --------------------------------------------------

describe("Login page", () => {
  beforeEach(() => {
    mockApiLogin.mockReset();
    mockAuthLoginUser.mockReset();
  });

  test("renders login form fields and button", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: /log in/i })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });

  test("submitting form calls api.login and AuthContext.loginUser", async () => {
    // Fake user object that the API would return
    const fakeUser = {
      username: "testuser",
      email: "test@example.com",
      zipcode: "01938",
      isAdmin: false,
    };

    // Make api.login resolve successfully
    mockApiLogin.mockResolvedValue(fakeUser);

    renderLogin();

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // Assert: we called the API with the right credentials
    await waitFor(() => {
      expect(mockApiLogin).toHaveBeenCalledWith({
        username: "testuser",
        password: "secret123",
      });
    });

    // Assert: we stored the user via AuthContext
    expect(mockAuthLoginUser).toHaveBeenCalledWith(fakeUser);
  });
});
