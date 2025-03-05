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
const pool_1 = require("../../pool");
const router = (0, express_1.Router)();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { start = "0", length = "10", search, order, draw = "1", columns, } = req.query;
        const startIndex = parseInt(start, 10);
        const pageSize = parseInt(length, 10);
        const drawNumber = parseInt(draw, 10);
        // **Extract Sorting Info from Request**
        let orderColumn = "id";
        let orderDirection = "ASC";
        if (order && columns) {
            try {
                const orderArray = JSON.parse(JSON.stringify(order));
                const columnsArray = JSON.parse(JSON.stringify(columns));
                const columnIndex = (_a = orderArray[0]) === null || _a === void 0 ? void 0 : _a.column;
                const columnDir = ((_b = orderArray[0]) === null || _b === void 0 ? void 0 : _b.dir) === "desc" ? "DESC" : "ASC";
                // **Map column index to actual DB field**
                const columnMapping = [
                    "id",
                    "name",
                    "title",
                    "experience",
                    "created_at",
                    "updated_at",
                ];
                if (columnsArray[columnIndex]) {
                    orderColumn = columnMapping[columnIndex] || "id";
                    orderDirection = columnDir;
                }
            }
            catch (error) {
                console.error("Sorting error:", error);
            }
        }
        // **Handle Search Query Safely**
        let searchQuery = "";
        let searchParams = [];
        if (search && search.value) {
            searchQuery = `
        WHERE name ILIKE $1
        OR title ILIKE $2
      `;
            searchParams = [
                `%${search.value}%`,
                `%${search.value}%`,
            ];
        }
        // **Get Total Records Count**
        const totalResult = yield pool_1.pool.query("SELECT COUNT(*) FROM guards");
        const totalRecords = parseInt(totalResult.rows[0].count, 10);
        // **Fetch Data with Sorting & Pagination**
        const query = `
      SELECT id, name, title, experience, created_at, updated_at
      FROM guards
      ${searchQuery}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT $${searchParams.length + 1} OFFSET $${searchParams.length + 2}
    `;
        const result = yield pool_1.pool.query(query, [
            ...searchParams,
            pageSize,
            startIndex,
        ]);
        // **Get Filtered Records Count**
        const filteredResult = yield pool_1.pool.query(`SELECT COUNT(*) FROM guards ${searchQuery}`, searchParams);
        const filteredRecords = parseInt(filteredResult.rows[0].count, 10);
        // **Send DataTables JSON Response**
        res.json({
            draw: drawNumber,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: result.rows,
        });
    }
    catch (error) {
        console.error("🔥 Error fetching guards:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = router;
