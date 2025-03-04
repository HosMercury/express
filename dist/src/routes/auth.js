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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const pool_1 = require("../pool");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Validation schema using Zod
const signInSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield pool_1.pool.query("SELECT * FROM users WHERE email = $1", [
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
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
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
    }
    catch (error) {
        console.error("Error signing in:", error);
        return res.status(500).render("pages/signin", {
            errors: { _error: "Internal server error." },
            formData: req.body,
        });
    }
}));
// Render the sign-in page with empty errors initially
router.get("/signin", (req, res) => {
    res.render("pages/signin", { errors: {}, formData: {} });
});
exports.default = router;
