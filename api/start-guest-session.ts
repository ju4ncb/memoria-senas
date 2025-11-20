import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  const connectionPromise = mysql.createConnection(dbConfig);

  const connection = await connectionPromise;

  const { username } = req.body;
  const randomProfileIconNumber = (
    Math.floor(Math.random() * 10) + 1
  ).toString();

  await connection.execute(
    "INSERT INTO guest_users (username, profile_icon_number) VALUES (?, ?)",
    [username, randomProfileIconNumber]
  );

  const [result] = await connection.execute(
    "SELECT LAST_INSERT_ID() as userId"
  );
  const userId = (result as any)[0].userId;

  const secret = process.env.GUEST_SESSION_JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret not configured");
  }

  const token = jwt.sign(
    { userId, username, randomProfileIconNumber },
    secret,
    {
      expiresIn: "1h",
    }
  );
  res.setHeader(
    "Set-Cookie",
    `guest_session_token=${token}; HttpOnly; Max-Age=3600; Path=/`
  );
  return res.status(200).json({ message: "Guest session started" });
}
