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
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const pool_1 = require("./src/pool"); // Import the database connection pool
const auth_1 = __importDefault(require("./src/routes/auth"));
const guards_1 = __importDefault(require("./src/routes/guards"));
const guards_2 = __importDefault(require("./src/routes/api/guards"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const auth_2 = __importDefault(require("./src/middlewares/auth"));
const connect_flash_1 = __importDefault(require("connect-flash"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
const PgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
// Correctly set views directory
const viewsPath = path_1.default.join(__dirname, "../views");
app.set("view engine", "ejs");
app.set("views", viewsPath);
// Middleware: Body Parsing
app.use(express_1.default.json()); // Parses JSON request bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parses URL-encoded request bodies
// Middleware: Express Session with PostgreSQL Store
app.set("trust proxy", 1);
app.use((0, express_session_1.default)({
    store: new PgStore({
        pool: pool_1.pool, // Use your database connection pool
        tableName: "sessions", // Custom table name for storing sessions
    }),
    secret: process.env.SESSION_SECRET,
    resave: false, // Avoids unnecessary session updates
    saveUninitialized: false, // Don't save empty sessions
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true, // Prevent client-side JavaScript access
        secure: process.env.NODE_ENV === "production", // Secure cookies in production
        sameSite: "strict", // Protect against CSRF attacks
    },
}));
// 🔹 Add `connect-flash` middleware **after session**
app.use((0, connect_flash_1.default)());
// 🔹 Middleware to pass flash messages to all views
app.use((req, res, next) => {
    res.locals.successMessage = req.flash("success");
    res.locals.errorMessage = req.flash("error");
    next();
});
// Serve static files (CSS, JS, images)
app.use(express_1.default.static("public"));
// Check database connection
function checkDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = yield pool_1.pool.connect(); // Get a connection from the pool
            yield client.query("SELECT 1"); // Run a test query
            client.release(); // Release the connection back to the pool
            console.log("✅ Database connection successful!");
        }
        catch (error) {
            console.error("❌ Database connection failed:", error);
            process.exit(1); // Exit the process if the database connection fails
        }
    });
}
// Example Route: Render an EJS template
app.get("/", auth_2.default, (req, res) => {
    res.render("index", {
        title: "Home Page",
        message: "Welcome to Express with EJS!",
    });
});
app.use("/auth", auth_1.default);
app.use("/api/guards", auth_2.default, guards_2.default);
app.use("/guards", auth_2.default, guards_1.default);
// Start the server after checking the database connection
checkDatabaseConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`Now listening on port ${PORT}`);
    });
});
