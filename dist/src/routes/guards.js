"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const pool_1 = require("../pool");
const router = (0, express_1.Router)();
// get all guards through table ==>
router.get("/", (req, res) => {
    res.render("pages/guard-index", { title: "Guards" });
});
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Query to fetch the guard by ID
        const result = yield pool_1.pool.query("SELECT * FROM guards WHERE id = $1", [id]);
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
    }
    catch (error) {
        console.error("🔥 Error fetching guard:", error);
        res.status(500).render("pages/error", { message: "Internal Server Error" });
    }
}));
router.get("/add", (req, res) => {
    res.render("pages/guard-add", {
        errors: {},
        formData: {},
        title: "Add Guard",
    });
});
router.get("/:id/edit", (req, res) => {
    res.render("pages/guard-edit", {
        errors: {},
        formData: {},
        title: "Edit Guard",
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
router.post("/add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield pool_1.pool.query("INSERT INTO guards (name, title, experience) VALUES ($1, $2, $3)", [formData.name, formData.title, formData.experience]);
        console.log("✅ Guard added successfully!");
        return res.redirect("/guards");
    }
    catch (error) {
        console.error("❌ Database Insert Error:", error);
        res.status(500).send("Internal Server Error");
    }
}));
exports.default = router;
