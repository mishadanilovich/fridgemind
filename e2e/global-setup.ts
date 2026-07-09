import "dotenv/config";

import { createTestUser } from "./support/test-user";

export default async function globalSetup() {
  await createTestUser();
}
