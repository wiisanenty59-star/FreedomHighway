import { Router, type IRouter } from "express";
import { db, forumCategoriesTable, threadsTable, postsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateThreadBody, CreatePostBody, ListThreadsQueryParams,
  GetThreadParams, DeleteThreadParams, CreatePostParams, DeletePostParams
} from "@workspace/api-zod";

const router: IRouter = Router();

async function requireApproved(req: any, res: any): Promise<typeof usersTable.$inferSelect | null> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!me || me.status !== "approved") {
    res.status(403).json({ error: "Account not approved" });
    return null;
  }
  return me;
}

function serializeThread(thread: any, author?: any, lastUser?: any, forumCat?: any) {
  return {
    id: thread.id,
    title: thread.title,
    content: thread.content,
    authorId: thread.authorId,
    authorUsername: author?.username ?? "unknown",
    forumCategoryId: thread.forumCategoryId,
    forumCategoryName: forumCat?.name ?? undefined,
    postCount: thread.postCount,
    viewCount: thread.viewCount,
    isPinned: thread.isPinned,
    isLocked: thread.isLocked,
    lastPostAt: thread.lastPostAt?.toISOString() ?? undefined,
    lastPostUsername: lastUser?.username ?? undefined,
    createdAt: thread.createdAt.toISOString(),
  };
}

function serializePost(post: any, author?: any) {
  return {
    id: post.id,
    content: post.content,
    authorId: post.authorId,
    authorUsername: author?.username ?? "unknown",
    authorRole: author?.role ?? "member",
    authorJoinedAt: author?.joinedAt?.toISOString() ?? undefined,
    authorPostCount: author?.postCount ?? 0,
    threadId: post.threadId,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString() ?? undefined,
  };
}

router.get("/forum/categories", async (req, res): Promise<void> => {
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

  const cats = await db.select().from(forumCategoriesTable).orderBy(forumCategoriesTable.sortOrder);
  res.json(cats.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description ?? undefined,
    slug: c.slug,
    icon: c.icon,
    threadCount: c.threadCount,
    postCount: c.postCount,
    lastThreadTitle: c.lastThreadTitle ?? undefined,
    lastThreadAt: c.lastThreadAt?.toISOString() ?? undefined,
  })));
});

router.get("/forum/stats", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const allThreads = await db.select().from(threadsTable);
  const allPosts = await db.select().from(postsTable);
  const allUsers = await db.select().from(usersTable).where(eq(usersTable.status, "approved"));

  const newest = allUsers.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())[0];

  res.json({
    totalThreads: allThreads.length,
    totalPosts: allPosts.length,
    totalMembers: allUsers.length,
    newestMember: newest?.username ?? undefined,
    onlineCount: 1,
  });
});

router.get("/forum/threads", async (req, res): Promise<void> => {
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

  const params = ListThreadsQueryParams.safeParse(req.query);

  let threads = await db.select().from(threadsTable).orderBy(desc(threadsTable.createdAt));

  if (params.success && params.data.categoryId) {
    threads = threads.filter(t => t.forumCategoryId === params.data.categoryId);
  }
  if (params.success && params.data.search) {
    const q = (params.data.search as string).toLowerCase();
    threads = threads.filter(t => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
  }

  const users = await db.select().from(usersTable);
  const cats = await db.select().from(forumCategoriesTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));

  res.json(threads.map(t => serializeThread(t, userMap[t.authorId], t.lastPostUserId ? userMap[t.lastPostUserId] : undefined, catMap[t.forumCategoryId])));
});

router.post("/forum/threads", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const parsed = CreateThreadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [thread] = await db.insert(threadsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    forumCategoryId: parsed.data.forumCategoryId,
    authorId: me.id,
    lastPostAt: new Date(),
    lastPostUserId: me.id,
  }).returning();

  const [cat] = await db.select().from(forumCategoriesTable).where(eq(forumCategoriesTable.id, parsed.data.forumCategoryId));
  if (cat) {
    await db.update(forumCategoriesTable).set({
      threadCount: cat.threadCount + 1,
      lastThreadTitle: parsed.data.title,
      lastThreadAt: new Date(),
    }).where(eq(forumCategoriesTable.id, cat.id));
  }

  res.status(201).json(serializeThread(thread, me, me, cat));
});

router.get("/forum/threads/:id", async (req, res): Promise<void> => {
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

  const params = GetThreadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [thread] = await db.select().from(threadsTable).where(eq(threadsTable.id, params.data.id));
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  await db.update(threadsTable).set({ viewCount: thread.viewCount + 1 }).where(eq(threadsTable.id, thread.id));

  const posts = await db.select().from(postsTable).where(eq(postsTable.threadId, thread.id)).orderBy(postsTable.createdAt);
  const users = await db.select().from(usersTable);
  const cats = await db.select().from(forumCategoriesTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));

  res.json({
    ...serializeThread(thread, userMap[thread.authorId], thread.lastPostUserId ? userMap[thread.lastPostUserId] : undefined, catMap[thread.forumCategoryId]),
    posts: posts.map(p => serializePost(p, userMap[p.authorId])),
  });
});

router.delete("/forum/threads/:id", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const params = DeleteThreadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [thread] = await db.select().from(threadsTable).where(eq(threadsTable.id, params.data.id));
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  if (thread.authorId !== me.id && me.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.threadId, thread.id));
  await db.delete(threadsTable).where(eq(threadsTable.id, thread.id));

  const [cat] = await db.select().from(forumCategoriesTable).where(eq(forumCategoriesTable.id, thread.forumCategoryId));
  if (cat) {
    await db.update(forumCategoriesTable).set({ threadCount: Math.max(0, cat.threadCount - 1) }).where(eq(forumCategoriesTable.id, cat.id));
  }

  res.json({ message: "Thread deleted" });
});

router.post("/forum/threads/:id/posts", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const params = CreatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid thread id" });
    return;
  }

  const [thread] = await db.select().from(threadsTable).where(eq(threadsTable.id, params.data.id));
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  if (thread.isLocked && me.role !== "admin") {
    res.status(403).json({ error: "Thread is locked" });
    return;
  }

  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db.insert(postsTable).values({
    content: parsed.data.content,
    authorId: me.id,
    threadId: thread.id,
  }).returning();

  await db.update(threadsTable).set({
    postCount: thread.postCount + 1,
    lastPostAt: new Date(),
    lastPostUserId: me.id,
  }).where(eq(threadsTable.id, thread.id));

  await db.update(usersTable).set({ postCount: me.postCount + 1 }).where(eq(usersTable.id, me.id));

  const [cat] = await db.select().from(forumCategoriesTable).where(eq(forumCategoriesTable.id, thread.forumCategoryId));
  if (cat) {
    await db.update(forumCategoriesTable).set({
      postCount: cat.postCount + 1,
      lastThreadAt: new Date(),
    }).where(eq(forumCategoriesTable.id, cat.id));
  }

  res.status(201).json(serializePost(post, me));
});

router.delete("/forum/posts/:id", async (req, res): Promise<void> => {
  const me = await requireApproved(req, res);
  if (!me) return;

  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.authorId !== me.id && me.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, post.id));

  const [thread] = await db.select().from(threadsTable).where(eq(threadsTable.id, post.threadId));
  if (thread) {
    await db.update(threadsTable).set({ postCount: Math.max(0, thread.postCount - 1) }).where(eq(threadsTable.id, thread.id));
  }

  res.json({ message: "Post deleted" });
});

export default router;
