"use server";

import { ID, Query } from "node-appwrite";
import { users } from "../appwrite.config"; 

type CreateUserParams = { name: string; email: string; phone?: string };

export async function createUser(user: CreateUserParams) {
  try {
    // Appwrite server SDK: users.create(userId, email?, phone?, password?, name?)
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );
    return newUser;
  } catch (err: any) {
    // If already exists, fetch by email
    if (err?.code === 409) {
      const existing = await users.list([Query.equal("email", [user.email])]);
      return existing.users[0];
    }
    throw err;
  }
}
