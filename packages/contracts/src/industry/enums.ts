import { z } from "zod";

export {
  GraphEntityTypeSchema,
  RelationshipTypeSchema,
} from "../relationship/schemas.js";

export const DiscoverEntityTypeSchema = z.enum([
  "Artist",
  "Venue",
  "Event",
  "Community",
]);

export const CollaborationRequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
]);

export const VenueIndoorOutdoorSchema = z.enum(["indoor", "outdoor", "hybrid"]);