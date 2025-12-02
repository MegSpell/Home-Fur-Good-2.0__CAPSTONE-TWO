import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DogDetail from "../pages/DogDetail";
import { useAuth } from "../context/AuthContext";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import * as api from "../api";

// --- Mocks ---------------------------------------------------

// Mock the API module with a factory so Jest never evaluates the real api.js
jest.mock("../api", () => ({
  getDog: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

// Mock AuthContext hook
jest.mock("../context/AuthContext");

// Mock react-router-dom pieces we rely on (params, navigate, location)
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
  };
});

// --- Helpers -------------------------------------------------

/**
 * Render DogDetail with a mocked dog, auth state, and "from" value.
 *
 * @param {Object} options
 * @param {Object} options.dogOverride    Fields to override on the fake dog
 * @param {Object} options.authOverride   Override for useAuth return value
 * @param {string|null} options.from      location.state.from (welcome, favorites, results, etc.)
 */
function renderDogDetail({
  dogOverride = {},
  authOverride = {},
  from = null,
} = {}) {
  const defaultDog = {
    id: "dog-123",
    name: "Buddy",
    city: "Ipswich",
    state: "MA",
    ageGroup: "Adult",
    sex: "Male",
    sizeGroup: "Medium",
    breedString: "Mixed Breed",
    distance: 12.3,
    photos: ["photo1.jpg", "photo2.jpg"],
    descriptionText: "Friendly dog looking for a home.",
    isDogsOk: true,
    isCatsOk: false,
    isKidsOk: true,
    isHousetrained: true,
    isSpecialNeeds: false,
    isNeedingFoster: false,
    url: "https://example-rescue.org/dog-123",
  };

  const fakeDog = { ...defaultDog, ...dogOverride };

  // API: when DogDetail calls getDog(id), return our fake dog
  api.getDog.mockResolvedValue(fakeDog);
  api.addFavorite.mockResolvedValue({});
  api.removeFavorite.mockResolvedValue({});

  // Router params: /dogs/:id -> { id: "dog-123" }
  useParams.mockReturnValue({ id: fakeDog.id });

  // Router location: allow DogDetail to inspect location.state.from
  if (from) {
    useLocation.mockReturnValue({ state: { from } });
  } else {
    useLocation.mockReturnValue({});
  }

  // Router navigate
  const mockNavigate = jest.fn();
  useNavigate.mockReturnValue(mockNavigate);

  // Auth context
  const defaultAuth = {
    user: { username: "testuser" },
    favorites: [],
    setFavorites: jest.fn(),
  };
  const authValue = { ...defaultAuth, ...authOverride };
  useAuth.mockReturnValue(authValue);

  // Render the component (no router wrapper needed since hooks are mocked)
  render(<DogDetail />);

  return {
    fakeDog,
    mockNavigate,
    authValue,
  };
}

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests ---------------------------------------------------

describe("DogDetail page", () => {
  test("loads and displays dog details", async () => {
    const { fakeDog } = renderDogDetail();

    // Initially: shows loading state
    expect(screen.getByText(/loading dog/i)).toBeInTheDocument();

    // After getDog resolves, we should see the dog's name and key info
    await waitFor(() =>
      expect(screen.getByText(fakeDog.name)).toBeInTheDocument()
    );

    // Location
    expect(
      screen.getByText(`${fakeDog.city}, ${fakeDog.state}`)
    ).toBeInTheDocument();

    // Quick stats
    expect(screen.getByText(/age:/i)).toBeInTheDocument();
    expect(screen.getByText(fakeDog.ageGroup)).toBeInTheDocument();

    expect(screen.getByText(/sex:/i)).toBeInTheDocument();
    expect(screen.getByText(fakeDog.sex)).toBeInTheDocument();

    expect(screen.getByText(/size:/i)).toBeInTheDocument();
    expect(screen.getByText(fakeDog.sizeGroup)).toBeInTheDocument();

    expect(screen.getByText(/breed:/i)).toBeInTheDocument();
    expect(
      screen.getByText(fakeDog.breedString, { exact: false })
    ).toBeInTheDocument();

    // External link button
    expect(
      screen.getByRole("link", {
        name: /view & apply on rescue website/i,
      })
    ).toHaveAttribute("href", fakeDog.url);
  });

  test("clicking heart when logged in adds and removes favorites", async () => {
    const mockSetFavorites = jest.fn();

    renderDogDetail({
      authOverride: {
        user: { username: "testuser" },
        favorites: [],
        setFavorites: mockSetFavorites,
      },
    });

    // Wait for dog to load
    const heartButton = await screen.findByRole("button", {
      name: /add to favorites/i,
    });

    // First click: should add favorite
    fireEvent.click(heartButton);

    await waitFor(() => {
      expect(api.addFavorite).toHaveBeenCalledWith("testuser", "dog-123");
      expect(mockSetFavorites).toHaveBeenCalled();
    });

    // Now simulate already-favorited state in a second render
    jest.clearAllMocks();

    renderDogDetail({
      authOverride: {
        user: { username: "testuser" },
        favorites: ["dog-123"],
        setFavorites: mockSetFavorites,
      },
    });

    const activeHeart = await screen.findByRole("button", {
      name: /remove from favorites/i,
    });

    fireEvent.click(activeHeart);

    await waitFor(() => {
      expect(api.removeFavorite).toHaveBeenCalledWith("testuser", "dog-123");
      expect(mockSetFavorites).toHaveBeenCalled();
    });
  });

  test("clicking heart when logged out navigates to /login", async () => {
    const { mockNavigate } = renderDogDetail({
      authOverride: {
        user: null,
        favorites: [],
      },
    });

    // Wait for dog to load
    const heartButton = await screen.findByRole("button", {
      name: /add to favorites/i,
    });

    fireEvent.click(heartButton);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("smart back button respects 'from' location state", async () => {
    const { mockNavigate } = renderDogDetail({ from: "favorites" });

    // Wait for dog to load
    await screen.findByText(/favorites/i);

    // Click the back button
    const backButton = screen.getByRole("button", {
      name: /back to favorites/i,
    });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/favorites");
  });
});
