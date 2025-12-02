// src/__tests__/Logout.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Logout from "../pages/Logout";

// Mock useAuth so it does NOT import AuthContext (which imports api)
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock navigate()
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

import { useAuth } from "../context/AuthContext";

function renderLogout() {
  return render(
    <MemoryRouter>
      <Logout />
    </MemoryRouter>
  );
}

describe("Logout page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders logging message", () => {
    useAuth.mockReturnValue({ logoutUser: jest.fn() });
    renderLogout();

    expect(screen.getByText(/logging you out/i)).toBeInTheDocument();
  });

  test("calls logoutUser and navigates to /login", async () => {
    const mockLogout = jest.fn().mockResolvedValue();
    useAuth.mockReturnValue({ logoutUser: mockLogout });

    renderLogout();

    // logoutUser should be called right away
    expect(mockLogout).toHaveBeenCalled();

    // navigate should be called after logout
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        replace: true,
      });
    });
  });
});
