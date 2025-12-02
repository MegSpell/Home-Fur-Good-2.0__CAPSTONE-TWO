// src/__tests__/Profile.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Profile from "../pages/Profile";
import { getProfile, updateProfile } from "../api";

// --- Mock AuthContext so we can control user/loginUser/setFlash ---

let mockUser;
let mockLoginUser = jest.fn();
let mockSetFlash = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    loginUser: mockLoginUser,
    setFlash: mockSetFlash,
  }),
}));

// --- Mock API functions used in Profile ---

jest.mock("../api", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

describe("Profile page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoginUser = jest.fn();
    mockSetFlash = jest.fn();
  });

  test("shows locked message when there is no logged in user", () => {
    mockUser = null;

    render(<Profile />);

    expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you need to log in to view and edit your profile/i)
    ).toBeInTheDocument();

    expect(getProfile).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test("loads profile data and pre-fills the form for a logged-in user", async () => {
    mockUser = {
      username: "meg",
      email: "old@example.com",
      zipcode: "01938",
    };

    getProfile.mockResolvedValueOnce({
      username: "meg",
      email: "meg@example.com",
      zipcode: "12345",
    });

    render(<Profile />);

    // Wait for the form to replace the "Loading profile…" text
    const usernameInput = await screen.findByLabelText(/username/i);

    // Username is shown and disabled
    expect(usernameInput).toBeDisabled();

    // Email and zipcode inputs show fetched values
    expect(
      screen.getByLabelText(/email/i)
    ).toHaveValue("meg@example.com");
    expect(
      screen.getByLabelText(/zipcode/i)
    ).toHaveValue("12345");

    // Password field starts empty
    expect(
      screen.getByLabelText(/new password/i)
    ).toHaveValue("");

    // And we definitely called the backend
    expect(getProfile).toHaveBeenCalledWith("meg");
  });

  test("submitting form calls updateProfile, updates AuthContext user, flashes success, and clears password", async () => {
    mockUser = {
      username: "meg",
      email: "old@example.com",
      zipcode: "01938",
    };

    getProfile.mockResolvedValueOnce({
      username: "meg",
      email: "meg@example.com",
      zipcode: "12345",
    });

    updateProfile.mockResolvedValueOnce({
      username: "meg",
      email: "new@example.com",
      zipcode: "22222",
    });

    render(<Profile />);

    // Wait for form to be ready
    await screen.findByLabelText(/email/i);

    // Fill in new values
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "new@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/zipcode/i), {
      target: { value: "22222" },
    });

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "secret123" },
    });

    // Submit the form
    fireEvent.submit(
      screen.getByRole("button", { name: /save changes/i }).closest("form")
    );

    // Ensure updateProfile was called with username + payload
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith("meg", {
        email: "new@example.com",
        zipcode: "22222",
        password: "secret123",
      });
    });

    // AuthContext.loginUser should be called with merged user info
    expect(mockLoginUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "meg",
        email: "new@example.com",
        zipcode: "22222",
      })
    );

    // Success flash shown
    expect(mockSetFlash).toHaveBeenCalledWith({
      type: "success",
      message: "Profile updated successfully.",
    });

    // Password field is cleared after successful save
//     expect(
//       screen.getByLabelText(/new password/i)
//     ).toHaveValue("");
//   });
  // Password field is cleared after successful save
  
  await waitFor(() => {
    expect(
      screen.getByLabelText(/new password/i)
    ).toHaveValue("");
  });
});

  test("shows error flash when updateProfile fails", async () => {
    mockUser = {
      username: "meg",
      email: "old@example.com",
      zipcode: "01938",
    };

    getProfile.mockResolvedValueOnce({
      username: "meg",
      email: "meg@example.com",
      zipcode: "12345",
    });

    updateProfile.mockRejectedValueOnce(new Error("boom"));

    render(<Profile />);

    // Wait for form
    await screen.findByLabelText(/email/i);

    // Change email so we actually send an update
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "oops@example.com" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /save changes/i }).closest("form")
    );

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalled();
    });

    expect(mockSetFlash).toHaveBeenCalledWith({
      type: "error",
      message: "Could not update profile. Please try again.",
    });
  });
});
