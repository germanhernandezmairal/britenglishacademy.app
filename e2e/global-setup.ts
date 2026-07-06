import { seedDatabase } from "./seed"

export default async function globalSetup() {
  await seedDatabase()
}
