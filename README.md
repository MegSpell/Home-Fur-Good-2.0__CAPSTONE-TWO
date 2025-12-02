🐾 Home Fur Good 2.0

A modern React + Node adoption platform helping overlooked rescue dogs find their FURever homes.

🔗 Live Site: Add your deployed URL here
🔗 Backend: Add deployed backend URL if applicable

📌 Description

Home Fur Good 2.0 is a full-stack dog adoption platform built with React, Node, and PostgreSQL, powered by real adoptable dog data from RescueGroups.org.

Users can:

Search adoptable dogs by detailed filters

Save favorites

View full dog detail pages

Edit their profile

Explore a unique Least Loved Spotlight showing the least-favorited dogs

This is the fully modernized React/Node expansion of my original Flask Capstone 1 project.

⭐ Features
1️⃣ Live Dog Search

Filter dogs by:

ZIP code + search radius

Sex, age group, size

Multi-breed selection

Behavior traits (dogs/cats/kids OK, special needs, housetrained, needs foster)

➡️ Replicates real rescue-site search systems.

2️⃣ Breed Parsing & Normalization

RescueGroups breed strings can be messy — multiple delimiters, mixed cases, etc.
Custom normalization ensures breed filtering works every time.

3️⃣ User Favorites System

Add/unadd dogs to favorites

Persisted in PostgreSQL

Favorites page shows saved dogs across sessions

➡️ Users never lose track of dogs they love.

4️⃣ “Least Loved Spotlight”

Displays three dogs with the lowest favorite counts either:

Near the user’s ZIP, or

From global counts (if user has no ZIP saved)

➡️ Boost visibility for overlooked dogs.

5️⃣ Detailed Dog Profiles

Each dog profile includes:

Full photo gallery

Breed, sex, size, age, weight

Behavior & temperament badges

Description text with auto-linked URLs

Location & distance

Rescue website button

Foster / special needs indicators

6️⃣ Secure Authentication

JWT auth

Hashed passwords (bcrypt)

Protected routes

Role-based admin access

7️⃣ Responsive UI

Mobile-first, fully responsive layout for:

Search

Dog detail

Navigation

Favorites

Admin pages

8️⃣ Node/Express Backend

Backend handles:

Authentication

User profile updates

Favorites (CRUD)

Dog search proxying

Dog detail proxying

Global favorite stats for admin + spotlight

Breed normalization logic

🧪 Testing
✔ Frontend Tests (React Testing Library + Jest)

Full tests written for:

Home

Login

Signup

Welcome

About

Search

SearchResults

DogDetail

Favorites

Profile

Logout

Admin

AdminEditUser

App (routing + protected routes)

Frontend tests cover:

Form rendering and behavior

API mocks

Redirect logic

Protected routes

Favorite toggling

Menu behavior

Spotlight selection

Admin-only access

✔ Backend Tests (Jest + Supertest)

Folder structure:

backend/
  __tests__/
    auth.test.js
    users.test.js
    favorites.test.js
    dogs.test.js


Run backend tests:

cd backend
npm test

🧭 User Flow
🏡 1. Home Page

Landing page → Login / Signup

🌟 2. Welcome Page

Shows spotlight dogs + search CTA.

🔎 3. Search

Apply filters → navigate to results.

📋 4. Search Results

View dog grid → click a dog for detail.

🐕 5. Dog Detail

Browse gallery → read stats → favorite dog → go to rescue site.

❤️ 6. Favorites

All favorited dogs shown here.

👤 7. Profile

Edit email, ZIP, optional password.

🛠️ 8. Admin

Admins can:

View all users

Edit users

Delete users

View global favorite counts

🖼️ Screenshots
📝 Sign Up Page
<img src="./public/screenshots/3screenshot-signup.png" width="700" alt="Sign Up Page" /> <p align="center"><em>New users can create an account to access search, favorites, and more.</em></p>
🔐 Login Page
<img src="./public/screenshots/2screenshot-login.png" width="700" alt="Login Page" /> <p align="center"><em>Existing users log in to access personalized features.</em></p>
🏡 Home Page
<img src="./public/screenshots/1screenshot-home.png" width="700" alt="Home Page" /> <p align="center"><em>Public landing page explaining the mission and login/signup options.</em></p>
🌟 Welcome Page
<img src="./public/screenshots/4screenshot-welcome.png" width="700" alt="Welcome Page" /> <p align="center"><em>Logged-in homepage with a spotlight section for least-favorited dogs.</em></p>
🛠️ Admin Welcome View
<img src="./public/screenshots/13screenshot-welcome.png" width="700" alt="Admin Welcome Page" /> <p align="center"><em>Admins see the same welcome layout but with admin-only tools enabled.</em></p>
🐾 About Page
<img src="./public/screenshots/9screenshot-about.png" width="700" alt="About Page" /> <p align="center"><em>Project background, purpose, and a personal introduction page.</em></p>
🔎 Search Page
<img src="./public/screenshots/5screenshot-search-results.png" width="700" alt="Search Page" /> <p align="center"><em>Filter dogs by ZIP, distance, age, size, sex, breed, and more.</em></p>
📋 Search Results
<img src="./public/screenshots/6screenshot-results.png" width="700" alt="Search Results" /> <p align="center"><em>Responsive dog card grid showing matches based on user filters.</em></p>
🐕 Dog Detail Page
<img src="./public/screenshots/7screenshot-dogdetail.png" width="700" alt="Dog Detail Page" /> <p align="center"><em>Full profile with photo gallery, description, stats, and rescue link.</em></p>
👤 Profile Page
<img src="./public/screenshots/10screenshot-profile.png" width="700" alt="Profile Page" /> <p align="center"><em>Users can view and edit their account details.</em></p>
❤️ Favorites Page
<img src="./public/screenshots/11screenshot-favorites.png" width="700" alt="Favorites Page" /> <p align="center"><em>Saved dogs appear here for quick access across sessions.</em></p>
📱 Navigation Menus
<img src="./public/screenshots/12screenshot-menudropdown.png" width="320" alt="Mobile Navigation" /> <p align="center"><em>Mobile-friendly dropdown menu with all user routes.</em></p> <img src="./public/screenshots/14screenshot-admin-dropdownmenu.png" width="320" alt="Admin Navigation" /> <p align="center"><em>Admin dropdown adds management and dashboard links.</em></p>
🛠️ Admin Dashboard
<img src="./public/screenshots/15screenshot-admin-dash.png" width="700" alt="Admin Dashboard" /> <p align="center"><em>Admins can view user activity and adoption engagement at a glance.</em></p>
🔌 API Documentation
🐶 External API — RescueGroups.org

Used for:

Search

Dog detail

Photos

Location

Rescue organization information

Backend normalizes this data for consistent frontend use.

🛠️ Internal API — Node/Express

Base URL:

VITE_API_BASE=http://localhost:3001

Auth

POST /auth/register

POST /auth/login

GET /auth/me

Users

GET /users/:username

PATCH /users/:username

DELETE /users/:username

Favorites

GET /users/:username/favorites

POST /users/:username/favorites/:dogId

DELETE /users/:username/favorites/:dogId

Dogs

GET /dogs

GET /dogs/:id

Backend responsibilities:

Clean breed strings

Extract photo galleries

Pull adoption/rescue URLs

Combine multiple API fields

Prevent API key exposure

🛠️ Tech Stack
Frontend

React 18

React Router 7

Context API

Vite

Axios

Custom CSS

Responsive design

Backend

Node.js

Express

PostgreSQL

JWT

Bcrypt

Axios

Database

Users table

Favorites join table

Admin seed user

📝 Additional Notes
🔒 API Limitations / Stretch Goals

RescueGroups sometimes provides generic rescue homepage URLs.

Future improvements:

Parse URLs directly from descriptions

Use organization website when available

Allow admins to manually override URLs

Add Petfinder fallback source

🤝 About the Developer

Built by Meghan — dog lover, equestrian, and full-stack software engineer
Dedicated to helping rescue animals find homes and building empathetic, meaningful technology.