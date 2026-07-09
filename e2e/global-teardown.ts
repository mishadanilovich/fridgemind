import "dotenv/config";

import { deleteTestUser, readTestUser } from "./support/test-user";

export default async function globalTeardown() {
  const user = readTestUser();
  await deleteTestUser(user);
}
