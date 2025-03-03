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
const express_1 = __importDefault(require("express"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./src/db")); // Import the database connection
const auth_1 = __importDefault(require("./src/routes/auth"));
dotenv_1.default.config();
const PORT = 8000;
const app = (0, express_1.default)();
// Correctly set views directory
const viewsPath = path_1.default.join(__dirname, "../views");
app.set("view engine", "ejs");
app.set("views", viewsPath);
// Middleware: Cookie Session
app.use((0, cookie_session_1.default)({
    name: "session",
    secret: process.env.SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
}));
// Serve static files (CSS, JS, images)
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Check database connection
function checkDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.one("SELECT 1");
            console.log("✅ Database connection successful!");
        }
        catch (error) {
            console.error("❌ Database connection failed:", error);
            process.exit(1); // Exit the process if the database connection fails
        }
    });
}
// Example Route: Render an EJS template
app.get("/", (req, res) => {
    res.render("index", {
        title: "Home Page",
        message: "Welcome to Express with EJS!",
    });
});
app.use("/auth", auth_1.default);
// Start the server after checking the database connection
checkDatabaseConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`Now listening on port ${PORT}`);
    });
});
