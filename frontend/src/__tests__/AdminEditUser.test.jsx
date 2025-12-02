// src/__tests__/AdminEditUser.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// ---- Mock react-router-dom hooks (for params + navigation) ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ username: "jane" }),
    useNavigate: () => mockNavigate,
  };
});

// ---- Mock AuthContext ----
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// ---- Mock API functions used by AdminEditUser ----
jest.mock("../api", () => ({
  getAllUsers: jest.fn(),
  adminUpdateUser: jest.fn(),
}));

import { useAuth } from "../context/AuthContext";
import { getAllUsers, adminUpdateUser } from "../api";
import AdminEditUser from "../pages/AdminEditUser";

describe("AdminEditUser page", () => {
  let mockSetFlash;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetFlash = jest.fn();
    useAuth.mockReturnValue({
      setFlash: mockSetFlash,
    });
  });

  test("loads user and pre-fills the form", async () => {
    getAllUsers.mockResolvedValue([
      { username: "jane", email: "jane@example.com", zipcode: "01938" },
      { username: "bob", email: "bob@example.com", zipcode: "12345" },
    ]);

    render(<AdminEditUser />);

    // Initial loading text
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(getAllUsers).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Username is read-only
    expect(screen.getByDisplayValue("jane")).toBeDisabled();

    // Email and zipcode pre-filled
    expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("01938")).toBeInTheDocument();

    // Password field starts empty — select by its value, not label
    const passwordInput = screen.getByDisplayValue("");
    expect(passwordInput).toBeInTheDocument();
  });

  test("submitting form calls adminUpdateUser, flashes success, and navigates back", async () => {
    getAllUsers.mockResolvedValue([
      { username: "jane", email: "jane@example.com", zipcode: "01938" },
    ]);
    adminUpdateUser.mockResolvedValue({});

    render(<AdminEditUser />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
    });

    const emailInput = screen.getByDisplayValue("jane@example.com");
    const zipInput = screen.getByDisplayValue("01938");
    const passwordInput = screen.getByDisplayValue("");

    // Change values
    fireEvent.change(emailInput, {
      target: { value: "new@example.com" },
    });
    fireEvent.change(zipInput, {
      target: { value: "02118" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "secret123" },
    });

    const submitBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminUpdateUser).toHaveBeenCalledWith("jane", {
        email: "new@example.com",
        zipcode: "02118",
        password: "secret123",
      });
    });

    expect(mockSetFlash).toHaveBeenCalledWith({
      type: "success",
      message: "Updated profile for jane.",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  test("if user is not found, flashes error and navigates back to /admin", async () => {
    getAllUsers.mockResolvedValue([
      { username: "bob", email: "bob@example.com", zipcode: "12345" },
    ]);

    render(<AdminEditUser />);

    await waitFor(() => {
      expect(getAllUsers).toHaveBeenCalledTimes(1);
    });

    expect(mockSetFlash).toHaveBeenCalledWith({
      type: "error",
      message: "User not found.",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  test("shows error flash when adminUpdateUser fails, stays on page", async () => {
    getAllUsers.mockResolvedValue([
      { username: "jane", email: "jane@example.com", zipcode: "01938" },
    ]);
    adminUpdateUser.mockRejectedValue(new Error("boom"));

    render(<AdminEditUser />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
    });

    const emailInput = screen.getByDisplayValue("jane@example.com");
    const zipInput = screen.getByDisplayValue("01938");
    const passwordInput = screen.getByDisplayValue("");

    fireEvent.change(emailInput, {
      target: { value: "oops@example.com" },
    });
    fireEvent.change(zipInput, {
      target: { value: "00000" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "newpass" },
    });

    const submitBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminUpdateUser).toHaveBeenCalledTimes(1);
    });

    expect(mockSetFlash).toHaveBeenCalledWith({
      type: "error",
      message: "Could not update user.",
    });

    // We should NOT have navigated away on error
    expect(mockNavigate).not.toHaveBeenCalledWith("/admin");
  });
});
