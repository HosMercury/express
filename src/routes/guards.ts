import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../pool";

const router = Router();

// get all guards through table ==>
router.get("/", (req: Request, res: Response) => {
  res.render("pages/guards", { title: "Guards" });
});

router.get("/add", (req: Request, res: Response) => {
  res.render("pages/guard-add", {
    errors: {},
    formData: {},
    title: "Add Guard",
  });
});

// Zod Schema for Validation
const guardSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  title: z.string().min(2, "Title is required"),
  experience: z
    .number()
    .min(0, "Experience must be at least 0 years")
    .max(50, "Experience must be realistic (max 50 years)"),
});

router.post("/add", async (req: Request, res: Response) => {
  const formData = {
    name: req.body.name,
    title: req.body.title,
    experience: Number(req.body.experience),
  };

  const result = guardSchema.safeParse(formData);

  if (!result.success) {
    const errors = result.error.format();
    return res.render("pages/guard-add", {
      errors,
      formData,
      title: "Add Guard",
    });
  }

  try {
    await pool.query(
      "INSERT INTO guards (name, title, experience) VALUES ($1, $2, $3)",
      [formData.name, formData.title, formData.experience]
    );

    console.log("✅ Guard added successfully!");
    return res.redirect("/guards");
  } catch (error) {
    console.error("❌ Database Insert Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
