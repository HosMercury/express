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

// Validation schemas using Zod
const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

router.post("/signup", async (req: Request, res: Response) => {
  const parseResult = signUpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).render("pages/signup", {
      errors: parseResult.error.format(),
      formData: req.body,
    });
  }

  const { name, email, password } = parseResult.data;

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).render("pages/signup", {
        errors: { email: "Email is already in use" },
        formData: req.body,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    req.session.user = {
      id: newUser.rows[0].id,
      name: newUser.rows[0].name,
      email: newUser.rows[0].email,
      createdAt: newUser.rows[0].created_at,
    };

    res.redirect("/");
  } catch (error) {
    console.error("Error signing up:", error);
    return res.status(500).render("pages/signup", {
      errors: { _error: "Internal server error." },
      formData: req.body,
    });
  }
});

router.get("/signup", (req: Request, res: Response) => {
  res.render("pages/signup", { errors: {}, formData: {} });
});

router.post("/signin", async (req: Request, res: Response) => {
  const parseResult = signInSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).render("pages/signin", {
      errors: parseResult.error.format(),
      formData: req.body,
    });
  }

  const { email, password } = parseResult.data;

  try {
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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("pages/signin", {
        title: "Sign in",
        errors: { _error: "Invalid credentials" },
        formData: req.body,
      });
    }

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

router.get("/signin", (req: Request, res: Response) => {
  res.render("pages/signin", { errors: {}, formData: {} });
});

router.post("/signout", requireAuth, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Failed to sign out");
    }
    res.redirect("/auth/signin");
  });
});

export default router;
