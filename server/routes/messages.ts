import { Router } from "express";
import { db } from "../db";
import { conversations, messages, clients, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, requireCompany } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachmentUrl: z.string().url().optional(),
});

router.get("/conversations", authMiddleware, requireCompany, async (req, res) => {
  try {
    const convos = await db.select({
      conversation: conversations,
      client: {
        id: clients.id,
      },
      clientUser: {
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(conversations)
    .innerJoin(clients, eq(conversations.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))
    .where(eq(conversations.companyId, req.user!.companyId!))
    .orderBy(desc(conversations.lastMessageAt));

    const convoWithLastMessage = await Promise.all(
      convos.map(async (c) => {
        const [lastMessage] = await db.select()
          .from(messages)
          .where(eq(messages.conversationId, c.conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);
        
        return { ...c, lastMessage };
      })
    );

    res.json({ conversations: convoWithLastMessage });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

router.get("/conversations/:clientId", authMiddleware, requireCompany, async (req, res) => {
  try {
    const [client] = await db.select().from(clients)
      .where(and(
        eq(clients.id, parseInt(req.params.clientId)),
        eq(clients.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    let [conversation] = await db.select().from(conversations)
      .where(and(
        eq(conversations.companyId, req.user!.companyId!),
        eq(conversations.clientId, client.id)
      ))
      .limit(1);

    if (!conversation) {
      [conversation] = await db.insert(conversations).values({
        companyId: req.user!.companyId!,
        clientId: client.id,
      }).returning();
    }

    const msgs = await db.select({
      message: messages,
      sender: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(messages.createdAt);

    await db.update(conversations)
      .set({ unreadCountCompany: 0 })
      .where(eq(conversations.id, conversation.id));

    res.json({ conversation, messages: msgs });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.post("/conversations/:clientId/messages", authMiddleware, requireCompany, async (req, res) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    
    const [client] = await db.select().from(clients)
      .where(and(
        eq(clients.id, parseInt(req.params.clientId)),
        eq(clients.companyId, req.user!.companyId!)
      ))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    let [conversation] = await db.select().from(conversations)
      .where(and(
        eq(conversations.companyId, req.user!.companyId!),
        eq(conversations.clientId, client.id)
      ))
      .limit(1);

    if (!conversation) {
      [conversation] = await db.insert(conversations).values({
        companyId: req.user!.companyId!,
        clientId: client.id,
      }).returning();
    }

    const [newMessage] = await db.insert(messages).values({
      conversationId: conversation.id,
      senderId: req.user!.userId,
      senderType: "company",
      content: data.content,
      attachmentUrl: data.attachmentUrl,
    }).returning();

    await db.update(conversations).set({
      lastMessageAt: new Date(),
      unreadCountClient: (conversation.unreadCountClient || 0) + 1,
      updatedAt: new Date(),
    }).where(eq(conversations.id, conversation.id));

    res.json({ message: newMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
