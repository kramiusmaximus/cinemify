import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? "8080");

async function main() {
  const app = await createApp();

  app.listen(port, () => {
    console.log(`cinemify-backend listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
