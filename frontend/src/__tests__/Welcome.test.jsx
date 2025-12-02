// src/__tests__/Welcome.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Welcome from "../pages/Welcome";

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api", () => ({
  searchDogs: jest.fn(),
  getDog: jest.fn(),
  getFavoriteCountsPublic: jest.fn(),
}));

import { useAuth } from "../context/AuthContext";
import {
  searchDogs,
  getDog,
  getFavoriteCountsPublic,
} from "../api";

describe("Welcome page", () => {
  function renderWelcome(userValue) {
    useAuth.mockReturnValue(userValue);

    return render(
      <MemoryRouter initialEntries={["/welcome"]}>
        <Welcome />
      </MemoryRouter>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders welcome hero with username and CTA", async () => {
    // Minimal mocks so effect can run
    searchDogs.mockResolvedValue({ dogs: [] });
    getFavoriteCountsPublic.mockResolvedValue({});

    renderWelcome({ user: { username: "Meg", zipcode: "01938" } });

    // Hero text is synchronous, but effect logs may be async
    expect(
      screen.getByText(/welcome to home fur good, meg!/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /search dogs/i })
    ).toBeInTheDocument();
  });

  test("with zipcode: shows least-favorited dogs NEAR user (3 lowest by count)", async () => {
    const user = { username: "Meg", zipcode: "01938" };

    // Dogs returned from local search near user
    const localDogs = [
      { id: "a", name: "Alfie", city: "Ipswich", state: "MA", photo: "p-a" },
      { id: "b", name: "Benji", city: "Salem", state: "MA", photo: "p-b" },
      { id: "c", name: "Cali", city: "Boston", state: "MA", photo: "p-c" },
      { id: "d", name: "Daisy", city: "Lynn", state: "MA", photo: "p-d" },
    ];

    // Global favorite counts keyed by dog id
    const counts = {
      a: 5,
      b: 0, // least
      c: 2,
      d: 7,
    };

    searchDogs.mockResolvedValue({ dogs: localDogs });
    getFavoriteCountsPublic.mockResolvedValue(counts);

    renderWelcome({ user });

    // Wait for the spotlight to load
    await waitFor(() => {
      expect(
        screen.getByText(/dogs in need spotlight/i)
      ).toBeInTheDocument();
    });

    // With zipcode, we should see the "near your area" subtitle variant
    expect(
      screen.getByText(/near your area/i)
    ).toBeInTheDocument();

    // Should show the THREE least-favorited dogs from the local search:
    // b(0), c(2), a(5) — in that order after sorting
    expect(screen.getByText("Benji")).toBeInTheDocument();
    expect(screen.getByText("Cali")).toBeInTheDocument();
    expect(screen.getByText("Alfie")).toBeInTheDocument();

    // Daisy has the highest count and should not be in the top 3
    expect(screen.queryByText("Daisy")).not.toBeInTheDocument();

    // Verify the search call used the user's zipcode
    expect(searchDogs).toHaveBeenCalledWith(
      expect.objectContaining({
        zip: "01938",
        miles: 50,
        hasPic: true,
      })
    );

    // In zipcode mode we never call getDog(), we rely on searchDogs results
    expect(getDog).not.toHaveBeenCalled();
  });

  test("without zipcode: uses global least-favorited dogs and getDog()", async () => {
    const user = { username: "Meg" }; // no zipcode -> hasZip = false

    // Global favorite counts only
    const counts = {
      x: 0,
      y: 1,
      z: 3,
    };

    getFavoriteCountsPublic.mockResolvedValue(counts);

    // For each ID we fetch full dog details
    getDog.mockImplementation(async (id) => {
      if (id === "x") {
        return { id: "x", name: "Xena", city: "Gloucester", state: "MA", photo: "p-x" };
      }
      if (id === "y") {
        return { id: "y", name: "Yoshi", city: "Beverly", state: "MA", photo: "p-y" };
      }
      if (id === "z") {
        return { id: "z", name: "Zelda", city: "Danvers", state: "MA", photo: "p-z" };
      }
      return { id, name: id };
    });

    // searchDogs should NOT be used in this mode
    searchDogs.mockResolvedValue({ dogs: [] });

    renderWelcome({ user });

    await waitFor(() => {
      expect(
        screen.getByText(/dogs in need spotlight/i)
      ).toBeInTheDocument();
    });

    // Global (no-zip) subtitle variant
    expect(
      screen.getByText(/across the app/i)
    ).toBeInTheDocument();

    // All three globally least-favorited dogs should appear
    expect(screen.getByText("Xena")).toBeInTheDocument();
    expect(screen.getByText("Yoshi")).toBeInTheDocument();
    expect(screen.getByText("Zelda")).toBeInTheDocument();

    // We should have looked up each dog by ID
    expect(getFavoriteCountsPublic).toHaveBeenCalledTimes(1);
    expect(searchDogs).not.toHaveBeenCalled();
    expect(getDog).toHaveBeenCalledTimes(3);
    expect(getDog).toHaveBeenCalledWith("x");
    expect(getDog).toHaveBeenCalledWith("y");
    expect(getDog).toHaveBeenCalledWith("z");
  });

  test("renders no spotlight section if there are no favorite counts", async () => {
    const user = { username: "Meg" };

    // No counts at all
    getFavoriteCountsPublic.mockResolvedValue({});
    // Not used here, but mock to avoid unexpected calls noise
    searchDogs.mockResolvedValue({ dogs: [] });

    renderWelcome({ user });

    // Wait a tick for the effect to run
    await waitFor(() => {
      // We expect NOT to see the spotlight heading at all
      expect(
        screen.queryByText(/dogs in need spotlight/i)
      ).not.toBeInTheDocument();
    });
  });
});
