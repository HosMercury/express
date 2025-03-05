import { Router, Request, Response } from "express";
import { pool } from "../pool";

const router = Router();

router.get("/guards", async (req: Request, res: Response) => {
  try {
    const {
      start = "0",
      length = "10",
      search,
      order,
      draw = "1",
      columns,
    } = req.query;

    const startIndex = parseInt(start as string, 10);
    const pageSize = parseInt(length as string, 10);
    const drawNumber = parseInt(draw as string, 10);

    // **Extract Sorting Info from Request**
    let orderColumn = "id";
    let orderDirection = "ASC";

    if (order && columns) {
      try {
        const orderArray = JSON.parse(JSON.stringify(order));
        const columnsArray = JSON.parse(JSON.stringify(columns));

        const columnIndex = orderArray[0]?.column;
        const columnDir = orderArray[0]?.dir === "desc" ? "DESC" : "ASC";

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
      } catch (error) {
        console.error("Sorting error:", error);
      }
    }

    // **Handle Search Query Safely**
    let searchQuery = "";
    let searchParams: any[] = [];

    if (search && (search as any).value) {
      searchQuery = `
        WHERE name ILIKE $1
        OR title ILIKE $2
      `;
      searchParams = [
        `%${(search as any).value}%`,
        `%${(search as any).value}%`,
      ];
    }

    // **Get Total Records Count**
    const totalResult = await pool.query("SELECT COUNT(*) FROM guards");
    const totalRecords = parseInt(totalResult.rows[0].count, 10);

    // **Fetch Data with Sorting & Pagination**
    const query = `
      SELECT id, name, title, experience, created_at, updated_at
      FROM guards
      ${searchQuery}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT $${searchParams.length + 1} OFFSET $${searchParams.length + 2}
    `;

    const result = await pool.query(query, [
      ...searchParams,
      pageSize,
      startIndex,
    ]);

    // **Get Filtered Records Count**
    const filteredResult = await pool.query(
      `SELECT COUNT(*) FROM guards ${searchQuery}`,
      searchParams
    );
    const filteredRecords = parseInt(filteredResult.rows[0].count, 10);

    // **Send DataTables JSON Response**
    res.json({
      draw: drawNumber,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: result.rows,
    });
  } catch (error) {
    console.error("🔥 Error fetching guards:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
