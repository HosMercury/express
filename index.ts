import express, { Express, Request, Response } from "express";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import path from "path";
import db from "./src/db"; // Import the database connection
import authRouter from "./src/routes/auth";

dotenv.config();

const PORT = 8000;
const app: Express = express();

// Correctly set views directory
const viewsPath = path.join(__dirname, "../views");

app.set("view engine", "ejs");
app.set("views", viewsPath);

// Middleware: Cookie Session
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET as string,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
);

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// Check database connection
async function checkDatabaseConnection() {
  try {
    await db.one("SELECT 1");
    console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Exit the process if the database connection fails
  }
}

// Example Route: Render an EJS template
app.get("/", (req: Request, res: Response) => {
  res.render("index", {
    title: "Home Page",
    message: "Welcome to Express with EJS!",
  });
});

app.use("/auth", authRouter);

// Start the server after checking the database connection
checkDatabaseConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Now listening on port ${PORT}`);
  });
});
