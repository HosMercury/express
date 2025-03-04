import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../pool";
import { z } from "zod";
import requireAuth from "../middlewares/auth";

const router = Router();

// Extend session data to include user info
declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      name: string;
      email: string;
      createdAt: Date;
    };
  }
}

// Validation schema using Zod
const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

router.post("/signin", async (req: Request, res: Response) => {
  // Validate request body
  const parseResult = signInSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).render("pages/signin", {
      errors: parseResult.error.format(),
      formData: req.body, // Preserve user input
    });
  }

  const { email, password } = parseResult.data;

  try {
    // Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).render("pages/signin", {
        title: "Sign in",
        errors: { _error: "Invalid credentials" },
        formData: req.body,
      });
    }

    const user = result.rows[0];

    // Compare provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("pages/signin", {
        title: "Sign in",
        errors: { _error: "Invalid credentials" },
        formData: req.body,
      });
    }

    // Store user data in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    };

    res.redirect("/");
  } catch (error) {
    console.error("Error signing in:", error);
    return res.status(500).render("pages/signin", {
      errors: { _error: "Internal server error." },
      formData: req.body,
    });
  }
});

// Render the sign-in page with empty errors initially
router.get("/signin", (req: Request, res: Response) => {
  res.render("pages/signin", { errors: {}, formData: {} });
});

router.post("/signout", requireAuth, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Failed to sign out");
    }
    res.redirect("/auth/signin"); // Redirect to login page after destroying session
  });
});

export default router;
