// src/pages/About.jsx
// ------------------------------------------------------------
// About Page
//
// This page tells the story behind Home Fur Good 2.0:
//   - What the app is
//   - Who inspired it (Archer, Albus, and Andy)
//   - A short bio about Meghan
//   - The rescues and tools that made it possible
//
// IMPORTANT:
//   - Only logged-in users can view this page.
//   - If no user is in AuthContext, we redirect to /login.
// ------------------------------------------------------------

import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Import local images used on the page.
import dogsPhoto from "../assets/my-dogs.jpg";
import rtrLogo from "../assets/ruff-tales-logo.png";
import lhk9Logo from "../assets/last-hope-logo.png";
import tulsaLogo from "../assets/tulsa-logo.png";
import megPhoto from "../assets/meg-photo.png";
import rescueGroupsImg from "../assets/rescuegroups.png";

export default function About() {
  const { user } = useAuth();

  // ------------------------------------------------------------
  // Route protection:
  //
  // If there is no logged-in user in AuthContext, this page
  // should not be visible. Instead, redirect to the login page.
  //
  // `replace` means "don't keep /about in browser history" so
  // the back button won't take them back to a protected page.
  // ------------------------------------------------------------
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Use only the first part of the username (before any space)
  // for a friendly, personalized line in the hero section.
  const firstName = user.username?.split(" ")[0] || user.username;

  return (
    <div className="about-page">
      {/* ========================================================
         HERO / INTRO CARD
         - Short explanation of what Home Fur Good 2.0 is
         - Personalized line for the logged-in user
         - Buttons to go back to Welcome or to Search
      ========================================================= */}
      <section className="about-card about-hero">
        <h1>About Home Fur Good 2.0</h1>

        <p className="about-lead">
          Home Fur Good 2.0 is a demo adoption app built by Meghan as part of
          the Springboard Software Engineering Career Track. It&apos;s inspired
          by real rescue pups and the incredible organizations who help dogs
          find safe, loving homes.
        </p>

        <p className="about-cta">
          As <strong>{firstName}</strong>, you can search for adoptable dogs,
          save your favorites, and even see a spotlight of pups in need near
          your zipcode.
        </p>

        <div className="about-hero-buttons">
          {/* Navigation buttons use React Router <Link> components */}
          <Link to="/welcome" className="btn-secondary">
            ← Back to Welcome
          </Link>
          <Link to="/search" className="btn-primary">
            Start Searching Dogs
          </Link>
        </div>
      </section>

      {/* ========================================================
         YOUR DOGS CARD
         - Introduces Archer, Albus, and Andy
         - Shows a photo + caption
      ========================================================= */}
      <section className="about-card about-dogs">
        <div className="about-dogs-text">
          <h2>Meet the Inspiration: Archer, Albus &amp; Andy</h2>

          <p>
            This app was inspired by three incredible rescue dogs —{" "}
            <strong>Archer</strong>, <strong>Albus</strong>, and{" "}
            <strong>Andy</strong>. Their journeys remind us why adoption is so
            important and why every dog deserves a second chance.
          </p>

          <p>
            Home Fur Good is built to make it easier for adopters to discover
            dogs, learn their stories, and hopefully give one of them their
            FURever home.
          </p>
        </div>

        <div className="about-dogs-photo-wrapper">
          <img
            src={dogsPhoto}
            alt="Andy, Archer, and Albus"
            className="about-dogs-photo"
          />
          <p className="about-dogs-caption">
            Archer, Albus &amp; Andy — the heart behind Home Fur Good.
          </p>
        </div>
      </section>

      {/* ========================================================
         ABOUT MEGHAN CARD
         - Short bio about you and your background
         - Photo of Meg
      ========================================================= */}
      <section className="about-card about-meg">
        <div className="about-meg-text">
          <h2>About Meghan</h2>

          <p>
            Meghan has spent much of her life working hands-on with animals —
            from managing an Olympic-level horse farm for over 16 years to
            rescuing and caring for dogs who needed a second chance. After years
            building structure, organization, and trust in real-world settings,
            she made the leap into software engineering through the Springboard
            Software Engineering Career Track.
          </p>

          <p>
            Her love of dogs — especially Archer, Albus and Andy — became the
            driving force behind Home Fur Good 2.0. Meghan believes technology
            can make a meaningful difference in the rescue world by helping
            overlooked pups get seen, shared, and ultimately adopted.
          </p>

          <p>
            Whether writing code, training horses, or giving a nervous shelter
            dog a warm place to land, Meg brings determination, compassion, and
            a fierce commitment to helping animals find their people.
          </p>
        </div>

        <div className="about-meg-photo-wrapper">
          <img src={megPhoto} alt="Meg portrait" className="about-meg-photo" />
        </div>
      </section>

      {/* ========================================================
         RESCUE ORGS CARD
         - Shows the rescues that brought your dogs into your life
         - Each card links out to the rescue's website
      ========================================================= */}
      <section className="about-card about-rescues">
        <h2>Rescues Who Made It Possible</h2>

        <p className="about-rescues-intro">
          These are the rescues who helped bring Archer, Albus and Andy into
          Meghan’s life. Click a card to visit their websites and discover more
          adoptable dogs.
        </p>

        <div className="rescue-grid">
          {/* Ruff Tales Rescue */}
          <a
            href="https://www.rufftalesrescue.org/"
            target="_blank"
            rel="noreferrer"
            className="rescue-card"
          >
            <div className="rescue-logo-wrap">
              <img
                src={rtrLogo}
                alt="Ruff Tales Rescue"
                className="rescue-logo"
              />
            </div>
            <h3>Ruff Tales Rescue</h3>
            <p>New England foster-based rescue — home of Archer.</p>
          </a>

          {/* Last Hope K9 */}
          <a
            href="https://www.lasthopek9.org/"
            target="_blank"
            rel="noreferrer"
            className="rescue-card"
          >
            <div className="rescue-logo-wrap">
              <img
                src={lhk9Logo}
                alt="Last Hope K9"
                className="rescue-logo"
              />
            </div>
            <h3>Last Hope K9 Rescue</h3>
            <p>
              Boston-based rescue helping Southern dogs find their people, like
              Albus!
            </p>
          </a>

          {/* Tulsa Animal Welfare */}
          <a
            href="https://www.cityoftulsa.org/TAS/"
            target="_blank"
            rel="noreferrer"
            className="rescue-card"
          >
            <div className="rescue-logo-wrap">
              <img
                src={tulsaLogo}
                alt="Tulsa Animal Welfare"
                className="rescue-logo"
              />
            </div>
            <h3>Tulsa Animal Welfare</h3>
            <p>
              Andy’s starting point — a shelter working hard for Tulsa’s lost
              and homeless animals.
            </p>
          </a>
        </div>
      </section>

      {/* ========================================================
         THANK YOU / CREDITS CARD
         - Acknowledges RescueGroups.org for powering the data
      ========================================================= */}
      <section className="about-thanks">
        <h2>A Special Thank You to:</h2>

        <div className="about-thanks-content">
          <img
            src={rescueGroupsImg}
            alt="RescueGroups.org website header"
            className="about-thanks-logo"
          />
          <p>
            Home Fur Good 2.0 is a demo app and would not have been possible
            without the data and tools provided by{" "}
            <a
              href="https://rescuegroups.org"
              target="_blank"
              rel="noreferrer"
            >
              RescueGroups.org
            </a>
            . Their technology and services support rescues and shelters across
            the country and help animals find loving homes.
          </p>
        </div>
      </section>
    </div>
  );
}

