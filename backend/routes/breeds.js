// backend/routes/breeds.js
// ------------------------------------------------------------
// This route serves a static list of dog breeds.
//
// Why?
//   - RescueGroups returns VERY inconsistent breed names.
//   - The frontend needs a predictable list of breeds for
//     checkboxes, dropdowns, or multi-select UI elements.
//
// This list is NOT from RescueGroups — it's intentionally curated
// to be clean, readable, and user-friendly.
//
// If you ever want to expand or tweak this list, just update
// the array below.
// ------------------------------------------------------------

import express from "express";

const router = new express.Router();

/**
 * Static list of common dog breeds used by the frontend UI.
 *
 * - You can add/remove breeds as you like
 * - Sorting ensures the list appears alphabetized in UI
 * - These names DO NOT have to perfectly match RescueGroups
 *   because breed filtering happens *locally* based on partial
 *   string matching (case-insensitive) in your dogs route.
 */
const DOG_BREEDS = [
  "All American Mix",
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Eskimo Dog",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "Anatolian Shepherd",
  "Australian Cattle Dog / Blue Heeler",
  "Australian Shepherd",
  "Basset Hound",
  "Beagle",
  "Belgian Malinois",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Black Labrador Retriever",
  "Bloodhound",
  "Border Collie",
  "Border Terrier",
  "Boston Terrier",
  "Boxer",
  "Brittany Spaniel",
  "Bull Terrier",
  "Bulldog",
  "Bullmastiff",
  "Cane Corso",
  "Cattle Dog Mix",
  "Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever",
  "Chihuahua",
  "Chinese Crested",
  "Chow Chow",
  "Cocker Spaniel",
  "Collie",
  "Coonhound",
  "Corgi",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher",
  "English Bulldog",
  "English Cocker Spaniel",
  "English Setter",
  "English Springer Spaniel",
  "French Bulldog",
  "German Shepherd Dog",
  "German Shorthaired Pointer",
  "Giant Schnauzer",
  "Golden Retriever",
  "Great Dane",
  "Great Pyrenees",
  "Greyhound",
  "Havanese",
  "Hound Mix",
  "Husky",
  "Irish Setter",
  "Irish Wolfhound",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Leonberger",
  "Lhasa Apso",
  "Maltese",
  "Mastiff",
  "Miniature Pinscher",
  "Newfoundland",
  "Papillon",
  "Pekingese",
  "Pit Bull Terrier",
  "Pointer",
  "Pomeranian",
  "Poodle",
  "Portuguese Water Dog",
  "Pug",
  "Rat Terrier",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint Bernard",
  "Samoyed",
  "Schipperke",
  "Schnauzer",
  "Scottish Terrier",
  "Shar Pei",
  "Sheltie, Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Spaniel Mix",
  "Staffordshire Bull Terrier",
  "Terrier Mix",
  "Vizsla",
  "Weimaraner",
  "Welsh Corgi",
  "West Highland White Terrier",
  "Wheaten Terrier",
  "Whippet",
  "Yorkshire Terrier"
].sort((a, b) => a.localeCompare(b));

/**
 * GET /breeds
 *
 * Returns:
 *   { breeds: [ "Affenpinscher", "Beagle", ... ] }
 *
 * The console log is just a friendly indication that the route was hit.
 * You can remove it if you prefer cleaner production logs.
 */
router.get("/", (req, res) => {
  console.log("📦 /breeds static route hit");
  return res.json({ breeds: DOG_BREEDS });
});

export default router;










//========before comments=========
// // backend/routes/breeds.js
// import express from "express";

// const router = new express.Router();

// /** 
//  * Static list of common dog breeds for UI.
//  * You can tweak/add/remove as you like.
//  */
// const DOG_BREEDS = [
//   "All American Mix",
//   "Affenpinscher",
//   "Afghan Hound",
//   "Airedale Terrier",
//   "Akita",
//   "Alaskan Malamute",
//   "American Bulldog",
//   "American Eskimo Dog",
//   "American Pit Bull Terrier",
//   "American Staffordshire Terrier",
//   "Anatolian Shepherd",
//   "Australian Cattle Dog / Blue Heeler",
//   "Australian Shepherd",
//   "Basset Hound",
//   "Beagle",
//   "Belgian Malinois",
//   "Bernese Mountain Dog",
//   "Bichon Frise",
//   "Black Labrador Retriever",
//   "Bloodhound",
//   "Border Collie",
//   "Border Terrier",
//   "Boston Terrier",
//   "Boxer",
//   "Brittany Spaniel",
//   "Bull Terrier",
//   "Bulldog",
//   "Bullmastiff",
//   "Cane Corso",
//   "Cattle Dog Mix",
//   "Cavalier King Charles Spaniel",
//   "Chesapeake Bay Retriever",
//   "Chihuahua",
//   "Chinese Crested",
//   "Chow Chow",
//   "Cocker Spaniel",
//   "Collie",
//   "Coonhound",
//   "Corgi",
//   "Dachshund",
//   "Dalmatian",
//   "Doberman Pinscher",
//   "English Bulldog",
//   "English Cocker Spaniel",
//   "English Setter",
//   "English Springer Spaniel",
//   "French Bulldog",
//   "German Shepherd Dog",
//   "German Shorthaired Pointer",
//   "Giant Schnauzer",
//   "Golden Retriever",
//   "Great Dane",
//   "Great Pyrenees",
//   "Greyhound",
//   "Havanese",
//   "Hound Mix",
//   "Husky",
//   "Irish Setter",
//   "Irish Wolfhound",
//   "Jack Russell Terrier",
//   "Labrador Retriever",
//   "Leonberger",
//   "Lhasa Apso",
//   "Maltese",
//   "Mastiff",
//   "Miniature Pinscher",
//   "Newfoundland",
//   "Papillon",
//   "Pekingese",
//   "Pit Bull Terrier",
//   "Pointer",
//   "Pomeranian",
//   "Poodle",
//   "Portuguese Water Dog",
//   "Pug",
//   "Rat Terrier",
//   "Rhodesian Ridgeback",
//   "Rottweiler",
//   "Saint Bernard",
//   "Samoyed",
//   "Schipperke",
//   "Schnauzer",
//   "Scottish Terrier",
//   "Shar Pei",
//   "Sheltie, Shetland Sheepdog",
//   "Shiba Inu",
//   "Shih Tzu",
//   "Siberian Husky",
//   "Spaniel Mix",
//   "Staffordshire Bull Terrier",
//   "Terrier Mix",
//   "Vizsla",
//   "Weimaraner",
//   "Welsh Corgi",
//   "West Highland White Terrier",
//   "Wheaten Terrier",
//   "Whippet",
//   "Yorkshire Terrier"
// ].sort((a, b) => a.localeCompare(b));

// router.get("/", (req, res) => {
//   console.log("📦 /breeds static route hit");
//   return res.json({ breeds: DOG_BREEDS });
// });

// export default router;
