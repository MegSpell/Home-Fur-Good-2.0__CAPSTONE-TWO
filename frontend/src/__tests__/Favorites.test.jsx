// src/__tests__/Favorites.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Favorites from "../pages/Favorites";
import { useAuth } from "../context/AuthContext";
import { getDog, addFavorite, removeFavorite } from "../api";
import { useNavigate } from "react-router-dom";

// ---- Mocks ----
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api", () => ({
  getDog: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    // we mock useNavigate so it doesn't depend on a real router
    useNavigate: jest.fn(),
    // simple Link replacement so <Link> doesn't need router context
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  };
});

const mockedUseNavigate = useNavigate;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigate.mockReturnValue(jest.fn());
});

// Small helper to configure AuthContext for each test
function setupAuth({ user = null, favorites = [], setFavorites = jest.fn() } = {}) {
  useAuth.mockReturnValue({ user, favorites, setFavorites });
  return { setFavorites };
}

describe("Favorites page", () => {
  test("shows empty state when user has no favorites", () => {
    setupAuth({
      user: { username: "meg" },
      favorites: [],
    });

    render(<Favorites />);

    expect(
      screen.getByText(/you haven't favorited any dogs yet/i)
    ).toBeInTheDocument();
    expect(getDog).not.toHaveBeenCalled();
  });

  test("loads and displays favorite dogs when there are IDs", async () => {
    setupAuth({
      user: { username: "meg" },
      favorites: ["dog1", "dog2"],
    });

    const dogData = {
      dog1: {
        id: "dog1",
        name: "Fido",
        city: "Boston",
        state: "MA",
        photo: "http://example.com/fido.jpg",
      },
      dog2: {
        id: "dog2",
        name: "Luna",
        city: "Salem",
        state: "MA",
        photo: "http://example.com/luna.jpg",
      },
    };

    getDog.mockImplementation((id) => Promise.resolve(dogData[id]));

    render(<Favorites />);

    // Wait for dogs to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText("Fido")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
    });

    expect(getDog).toHaveBeenCalledTimes(2);
    expect(getDog).toHaveBeenCalledWith("dog1");
    expect(getDog).toHaveBeenCalledWith("dog2");
  });

  test("clicking heart removes a favorite dog and calls backend + setFavorites", async () => {
    const { setFavorites } = setupAuth({
      user: { username: "meg" },
      favorites: ["dog1"],
    });

    getDog.mockResolvedValue({
      id: "dog1",
      name: "Fido",
      city: "Boston",
      state: "MA",
      photo: "http://example.com/fido.jpg",
    });

    removeFavorite.mockResolvedValue({});

    render(<Favorites />);

    // wait for the dog to show up
    await waitFor(() => {
      expect(screen.getByText("Fido")).toBeInTheDocument();
    });

    const heartButton = screen.getByRole("button", {
      name: /remove from favorites/i,
    });

    fireEvent.click(heartButton);

    await waitFor(() => {
      // backend call
      expect(removeFavorite).toHaveBeenCalledWith("meg", "dog1");
      // context update (called with a function)
      expect(setFavorites).toHaveBeenCalled();
      // card removed from UI
      expect(screen.queryByText("Fido")).not.toBeInTheDocument();
    });
  });
});
