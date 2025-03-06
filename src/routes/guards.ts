import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../pool";

const router = Router();

// get all guards through table ==>
router.get("/", (req: Request, res: Response) => {
  res.render("pages/guard-index", { title: "Guards" });
});

router.get("/add", (req: Request, res: Response) => {
  console.log("Rendering guard-add.ejs");

  res.render("pages/guard-add", {
    errors: {},
    formData: {},
    title: "Add Guard",
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Query to fetch the guard by ID
    const result = await pool.query("SELECT * FROM guards WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .render("pages/404", { message: "Guard not found" });
    }

    const guard = result.rows[0];

    // Render the view and pass the guard data
    res.render("pages/guard-show", {
      title: `Guard: ${guard.name}`,
      guard,
    });
  } catch (error) {
    console.error("🔥 Error fetching guard:", error);
    res.status(500).render("pages/error", { message: "Internal Server Error" });
  }
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

router.get("/:id/edit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch the guard by ID
    const result = await pool.query("SELECT * FROM guards WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .render("pages/404", { message: "Guard not found" });
    }

    const guard = result.rows[0];

    // Render the edit page with guard data
    res.render("pages/guard-edit", {
      title: `Edit Guard: ${guard.name}`,
      guard,
      errors: {},
      formData: {}, // Empty formData for initial rendering
    });
  } catch (error) {
    console.error("🔥 Error fetching guard:", error);
    res.status(500).render("pages/error", { message: "Internal Server Error" });
  }
});

router.post("/:id/edit", async (req: Request, res: Response) => {
  const { id } = req.params;

  const formData = {
    name: req.body.name,
    title: req.body.title,
    experience: Number(req.body.experience),
  };

  // Validate form data using Zod
  const result = guardSchema.safeParse(formData);

  if (!result.success) {
    const errors = result.error.format();

    // Fetch the guard again to keep the existing data
    const guardResult = await pool.query("SELECT * FROM guards WHERE id = $1", [
      id,
    ]);

    if (guardResult.rows.length === 0) {
      return res
        .status(404)
        .render("pages/404", { message: "Guard not found" });
    }

    const guard = guardResult.rows[0];

    return res.render("pages/guard-edit", {
      title: `Edit Guard: ${guard.name}`,
      guard,
      errors,
      formData,
    });
  }

  try {
    // Update guard in the database
    const updatedGuard = await pool.query(
      "UPDATE guards SET name = $1, title = $2, experience = $3 WHERE id = $4 RETURNING *",
      [formData.name, formData.title, formData.experience, id]
    );

    if (updatedGuard.rowCount === 0) {
      return res
        .status(404)
        .render("pages/404", { message: "Guard not found" });
    }

    req.flash("success", "Guard updated successfully!");
    return res.redirect(`/guards/${id}`);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

router.post("/:id/delete", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM guards WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .render("pages/404", { message: "Guard not found" });
    }

    req.flash("success", "Guard deleted successfully!");
    return res.redirect("/guards");
  } catch (error) {
    console.error("🔥 Error deleting guard:", error);
    res.status(500).render("pages/error", { message: "Internal Server Error" });
  }
});

router.post("/:id/delete", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM guards WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .render("pages/404", { message: "Guard not found" });
    }

    req.flash("success", "Guard deleted successfully!");
    return res.redirect("/guards");
  } catch (error) {
    console.error("🔥 Error deleting guard:", error);
    res.status(500).render("pages/error", { message: "Internal Server Error" });
  }
});

export default router;
