"use server";

import { ID, Query } from "node-appwrite";
import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
  PATIENT_COLLECTION_ID,
} from "../appwrite.config";
import { parseStringify } from "../utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";   // <- add this

// CREATE APPOINTMENT
export const createAppointment = async (appointment: any) => {
  try {
    const scheduleISO =
      appointment?.schedule instanceof Date
        ? appointment.schedule.toISOString()
        : new Date(appointment?.schedule).toISOString();

    const payload = {
      userId: appointment.userId,
      patient: appointment.patient,
      primaryPhysician: appointment.primaryPhysician,
      schedule: scheduleISO,
      reason: appointment.reason ?? "",
      note: appointment.note ?? "",
      status: appointment.status,
    };

    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      payload
    );

    return parseStringify(newAppointment);
  } catch (error) {
    console.error("An error occurred while creating a new appointment:", error);
    throw error;
  }
};



export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.log(error);
  }
};


//  GET RECENT APPOINTMENTS
export const getRecentAppointmentList = async () => {
  noStore(); 
  try {
    // 1) Appointments (newest first)
    const apptRes = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.orderDesc("$createdAt")]
    );

    const apptDocs = apptRes.documents || [];

    // 2) Status counts
    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = apptDocs.reduce((acc: any, doc: any) => {
      switch (doc.status) {
        case "scheduled":
          acc.scheduledCount++;
          break;
        case "pending":
          acc.pendingCount++;
          break;
        case "cancelled":
          acc.cancelledCount++;
          break;
      }
      return acc;
    }, initialCounts);

    // 3) Collect patient ids (handles both string id and relation object)
    const patientIds = Array.from(
      new Set(
        apptDocs
          .map((d: any) =>
            typeof d.patient === "string" ? d.patient : d.patient?.$id
          )
          .filter(Boolean)
      )
    );

    // 4) Fetch patient docs in one shot and index by id
    let patientsMap = new Map<string, any>();
    if (patientIds.length) {
      const patRes = await databases.listDocuments(
        DATABASE_ID!,
        PATIENT_COLLECTION_ID!,
        [Query.equal("$id", patientIds)]
      );
      patientsMap = new Map(
        patRes.documents.map((p: any) => [p.$id, p])
      );
    }

    // 5) Enrich each appointment with its patient object
    const enriched = apptDocs.map((d: any) => {
      const pid = typeof d.patient === "string" ? d.patient : d.patient?.$id;
      return {
        ...d,
        patient: patientsMap.get(pid) ?? d.patient ?? { $id: pid, name: "Unknown" },
      };
    });

    // 6) Final payload for Admin page
    return parseStringify({
      totalCount: apptRes.total,
      ...counts,
      documents: enriched,
    });
  } catch (error) {
    console.error("getRecentAppointmentList error:", error);
    // Safe fallback so page still renders
    return {
      totalCount: 0,
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      documents: [],
    };
  }
};


//  UPDATE APPOINTMENT
export const updateAppointment = async ({appointmentId,userId,appointment,type,}: UpdateAppointmentParams) => {
  try {
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      appointment
    );

    if (!updatedAppointment) throw Error;

    revalidatePath('/admin');
    return parseStringify(updatedAppointment);
    
  } catch (error) {
    console.error("An error occurred while scheduling an appointment:", error);
  }
};
