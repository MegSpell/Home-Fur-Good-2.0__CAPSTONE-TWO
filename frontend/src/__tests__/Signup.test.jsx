// src/__tests__/Signup.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "../pages/Signup";
import { useAuth } from "../context/AuthContext";

// ✅ Hard mock ../api so Jest never evaluates api.js (no import.meta error)
jest.mock("../api", () => ({
  __esModule: true,
  signup: jest.fn(),   // this is what Signup.jsx imports as apiSignup
}));

// Pull the mocked function so we can control it
import { signup as apiSignup } from "../api";

// Mock AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom hooks but keep the real components
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({ state: null })), // no special redirect state for signup
  };
});

// Helper render
function renderSignup() {
  const mockAuthLogin = jest.fn();
  const mockNavigate = jest.fn();

  useAuth.mockReturnValue({
    user: null,
    loginUser: mockAuthLogin,
    logoutUser: jest.fn(),
  });

  require("react-router-dom").useNavigate.mockReturnValue(mockNavigate);

  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Signup />
    </MemoryRouter>
  );

  return { mockAuthLogin, mockNavigate };
}

describe("Signup page", () => {
  test("renders signup form fields and button", () => {
    renderSignup();

    expect(
      screen.getByRole("heading", { name: /create an account/i })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  test("submitting form calls api.signup and AuthContext.loginUser", async () => {
    const mockUser = {
      username: "newuser",
      email: "new@example.com",
      zipcode: "01938",
      isAdmin: false,
    };

    apiSignup.mockResolvedValueOnce(mockUser);

    const { mockAuthLogin, mockNavigate } = renderSignup();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/zip/i), {
      target: { value: "01938" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(apiSignup).toHaveBeenCalledWith({
        username: "newuser",
        password: "secret123",
        email: "new@example.com",
        zipcode: "01938",
      });

      expect(mockAuthLogin).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
