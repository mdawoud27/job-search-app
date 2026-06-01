export default async function globalTeardown() {
  await global.__MONGOD__?.stop();
}
