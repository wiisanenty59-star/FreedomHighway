import { Router, type IRouter } from "express";
import { db, categoriesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return;
  }

  const cats = await db.select().from(categoriesTable);
  res.json(cats);
});

export default router;
