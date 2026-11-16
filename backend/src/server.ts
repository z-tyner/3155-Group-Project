/**
 * @file server.ts
 * @description Application entry point that initializes database connections and starts the Express HTTP server listening on the configured port.
 */

import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
