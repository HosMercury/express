import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.render("pages/guards", { errors: {}, formData: {}, title: "Guards" });
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

router.post("/add", (req: Request, res: Response) => {
  // Extract form data
  const formData = {
    name: req.body.name,
    title: req.body.title,
    experience: Number(req.body.experience), // Ensure it's a number
  };

  // Validate using Zod
  const result = guardSchema.safeParse(formData);

  if (!result.success) {
    // Convert Zod errors to a usable format
    const errors = result.error.format();
    return res.render("pages/guard-add", {
      errors,
      formData,
      title: "Add Guard",
    });
  }

  // If validation passes, proceed with saving (placeholder)
  console.log("✅ Guard Data Validated:", result.data);

  // TODO: Save to database (replace with actual DB logic)
  return res.redirect("/guards");
});

export default router;
