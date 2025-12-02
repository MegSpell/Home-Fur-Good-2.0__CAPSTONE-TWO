// __tests__/helpers.test.js
// ------------------------------------------------------------
// Tests for the RescueGroups helper module.
//
// We *don't* actually call searchAvailableDogs / getDogById here,
// because in tests we don't want to make real HTTP requests.
//
// Instead, we verify that:
//   - the module loads
//   - the key functions are exported
//   - the test environment uses a fake API key value so we can't
//     accidentally hit the real RescueGroups API.
// ------------------------------------------------------------
import "./_testSetup.js";

import { searchAvailableDogs, getDogById } from "../helpers/rescueGroups.js";

describe("RescueGroups helpers", () => {
  test("exports the expected functions", () => {
    expect(typeof searchAvailableDogs).toBe("function");
    expect(typeof getDogById).toBe("function");
  });

  test("test env uses a fake API key (so no real API calls)", () => {
    // .env.test sets RESCUEGROUPS_API_KEY=FAKE_TEST_KEY
    expect(process.env.RESCUEGROUPS_API_KEY).toBe("FAKE_TEST_KEY");
  });
});
