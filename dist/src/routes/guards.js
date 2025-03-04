"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.render("pages/guards", { errors: {}, formData: {}, title: "Guards" });
});
router.get("/add", (req, res) => {
    res.render("pages/guard-add", {
        errors: {},
        formData: {},
        title: "Add Guard",
    });
});
// Zod Schema for Validation
const guardSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Name must be at least 3 characters"),
    title: zod_1.z.string().min(2, "Title is required"),
    experience: zod_1.z
        .number()
        .min(0, "Experience must be at least 0 years")
        .max(50, "Experience must be realistic (max 50 years)"),
});
router.post("/add", (req, res) => {
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
exports.default = router;
