"use server";

import { ID } from "node-appwrite";
import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
} from "../appwrite.config";
import { parseStringify } from "../utils";

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
