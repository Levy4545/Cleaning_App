import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { reviews } from "@/db/schema";

export async function findReviewByAppointment(appointmentId: string, shopId: string) {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.appointmentId, appointmentId), eq(reviews.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function createReview(data: {
  shopId: string;
  appointmentId: string;
  customerId: string;
  rating: number;
  comment?: string;
}) {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const [row] = await db.insert(reviews).values(data).returning();
  return row;
}
