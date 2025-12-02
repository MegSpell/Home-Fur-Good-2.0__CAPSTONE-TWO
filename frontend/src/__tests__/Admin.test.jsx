// src/__tests__/Admin.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock AuthContext so we don't import the real one (which pulls in api.js)
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock the admin-related API functions
jest.mock("../api", () => ({
  getAllUsers: jest.fn(),
  getFavoriteCountsAdmin: jest.fn(),
  adminDeleteUser: jest.fn(),
}));

import { useAuth } from "../context/AuthContext";
import {
  getAllUsers,
  getFavoriteCountsAdmin,
  adminDeleteUser,
} from "../api";
import Admin from "../pages/Admin";

function renderAdminWithUser(user) {
  useAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>
  );
}

describe("Admin page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows 'Admin Only' message for non-admin users", () => {
    renderAdminWithUser({ username: "meg", isAdmin: false });

    expect(screen.getByText(/admin only/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/admin dashboard/i)
    ).not.toBeInTheDocument();
  });

  test("loads and displays user + favorite counts tables for admin user", async () => {
    const mockUsers = [
      {
        username: "admin",
        email: "root@example.com",
        isAdmin: true,
        favorites: ["dog-1"],
        favoritesCount: 1,
      },
      {
        username: "jane",
        email: "jane@example.com",
        isAdmin: false,
        favorites: ["dog-2", "dog-3"],
        favoritesCount: 2,
      },
    ];

    const mockCounts = {
      "dog-1": 5,
      "dog-2": 1,
    };

    getAllUsers.mockResolvedValue(mockUsers);
    getFavoriteCountsAdmin.mockResolvedValue(mockCounts);

    renderAdminWithUser({ username: "admin", isAdmin: true });

    // Wait for the async data load to complete
    await waitFor(() => {
      expect(getAllUsers).toHaveBeenCalledTimes(1);
      expect(getFavoriteCountsAdmin).toHaveBeenCalledTimes(1);
    });

    // Users table is rendered with our mock data
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("jane")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();

    // Favorite counts table shows heading
    expect(
      screen.getByText(/favorite counts \(all dogs\)/i)
    ).toBeInTheDocument();

    // "dog-1" appears in BOTH tables; that's ok, use getAllByText
    const dog1Cells = screen.getAllByText("dog-1");
    expect(dog1Cells.length).toBeGreaterThanOrEqual(1);

    // Counts should appear somewhere in the counts table
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  test("clicking Delete calls adminDeleteUser and reloads data", async () => {
    const mockUsers = [
      {
        username: "admin",
        email: "root@example.com",
        isAdmin: true,
        favorites: [],
        favoritesCount: 0,
      },
      {
        username: "bob",
        email: "bob@example.com",
        isAdmin: false,
        favorites: ["dog-9"],
        favoritesCount: 1,
      },
    ];

    const mockCounts = { "dog-9": 1 };

    getAllUsers.mockResolvedValue(mockUsers);
    getFavoriteCountsAdmin.mockResolvedValue(mockCounts);
    adminDeleteUser.mockResolvedValue();

    // Always confirm the deletion
    const confirmSpy = jest
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    renderAdminWithUser({ username: "admin", isAdmin: true });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("bob")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete user "bob"?'
    );
    expect(adminDeleteUser).toHaveBeenCalledWith("bob");

    // After deletion, loadData() should run again (and call getAllUsers)
    await waitFor(() => {
      expect(getAllUsers).toHaveBeenCalledTimes(2);
    });

    confirmSpy.mockRestore();
  });
});
