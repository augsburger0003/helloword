// Keep the package entry point wired to the complete marketplace server.
// The previous static-only server exposed the obsolete helloword landing page
// from public/ and bypassed the API, persistence, migrations, and seed.
import "./src/server.js";