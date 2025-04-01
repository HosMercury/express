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
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
// Validation schemas using Zod
const signInSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
const signUpSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters long"),
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parseResult = signUpSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).render("pages/signup", {
            errors: parseResult.error.format(),
            formData: req.body,
        });
    }
    const { name, email, password } = parseResult.data;
    try {
        const existingUser = yield pool_1.pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).render("pages/signup", {
                errors: { email: "Email is already in use" },
                formData: req.body,
            });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        const newUser = yield pool_1.pool.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *", [name, email, hashedPassword]);
        req.session.user = {
            id: newUser.rows[0].id,
            name: newUser.rows[0].name,
            email: newUser.rows[0].email,
            createdAt: newUser.rows[0].created_at,
        };
        res.redirect("/");
    }
    catch (error) {
        console.error("Error signing up:", error);
        return res.status(500).render("pages/signup", {
            errors: { _error: "Internal server error." },
            formData: req.body,
        });
    }
}));
router.get("/signup", (req, res) => {
    res.render("pages/signup", { errors: {}, formData: {} });
});
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parseResult = signInSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).render("pages/signin", {
            errors: parseResult.error.format(),
            formData: req.body,
        });
    }
    const { email, password } = parseResult.data;
    try {
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
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
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
    }
    catch (error) {
        console.error("Error signing in:", error);
        return res.status(500).render("pages/signin", {
            errors: { _error: "Internal server error." },
            formData: req.body,
        });
    }
}));
router.get("/signin", (req, res) => {
    res.render("pages/signin", { errors: {}, formData: {} });
});
router.post("/signout", auth_1.default, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Failed to sign out");
        }
        res.redirect("/auth/signin");
    });
});
exports.default = router;
