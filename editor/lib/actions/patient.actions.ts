"use server";

import { ID, Query } from "node-appwrite";
import { BUCKET_ID, DATABASE_ID, databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users } from "../appwrite.config"; 
import { parseStringify } from "../utils";

import {InputFile} from "node-appwrite/file"

type CreateUserParams = { name: string; email: string; phone?: string };

export async function createUser(user: CreateUserParams) {
  try {
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );
    return newUser;
  } catch (err: any) {
    if (err?.code === 409) {
      const existing = await users.list([Query.equal("email", [user.email])]);
      return existing.users[0];
    }
    throw err;
  }
}

export const getUser = async (userId: string) => {
  try{
    const user = await users.get(userId);
    return parseStringify(user);

  }catch (error){
    console.log(error)
  }
}

// REGISTER PATIENT
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;
    if (identificationDocument) {
      const inputFile =
        identificationDocument &&
        InputFile.fromBuffer(
          identificationDocument?.get("blobFile") as Blob,
          identificationDocument?.get("fileName") as string
        );

      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
    }

    // Create new patient document 
    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id ? file.$id : null,
        identificationDocumentUrl: file?.$id
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view??project=${PROJECT_ID}`
          : null,
        ...patient,
      }
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.error("An error occurred while creating a new patient:", error);
  }
};


// GET PATIENT
export const getPatient = async (userId: string) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );
    if (res.total > 0) return parseStringify(res.documents[0]);

    const all = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!
    );
    const match =
      all.documents.find((d: any) => d.userId === userId) ||
      all.documents.find((d: any) => d.UserId === userId) ||
      all.documents.find((d: any) => d.userID === userId);

    return match ? parseStringify(match) : null;
  } catch (error) {
    console.error("getPatient error:", error);
    return null;
  }
};
