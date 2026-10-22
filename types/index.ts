// Application Domain Types (Handwritten)
// Generated Supabase schema types are isolated in ./database.types.ts

import type { Tables, TablesInsert, TablesUpdate } from './database.types';

export type { Database } from './database.types';

// Controlled Enumeration Sets
export type UserRole = 'resident' | 'responder' | 'dispatcher' | 'admin';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | 'duplicate'
  | 'cancelled';

export type UpdateVisibility = 'public' | 'internal';

// Controlled Field Responders (Responder 1–5)
export const FIELD_RESPONDERS = [
  'Responder 1',
  'Responder 2',
  'Responder 3',
  'Responder 4',
  'Responder 5',
] as const;

export type FieldResponder = (typeof FIELD_RESPONDERS)[number];

// Controlled Internal Dispatch Instructions
export const DISPATCH_INSTRUCTIONS = [
  'Inspect Incident Location',
  'Assess Incident Severity',
  'Secure the Affected Area',
  'Provide Immediate Assistance',
  'Coordinate With Relevant Department',
  'Prepare Required Equipment',
  'Follow Up on Incident',
  'Verify Incident Resolution',
] as const;

export type DispatchInstruction = (typeof DISPATCH_INSTRUCTIONS)[number];

// Controlled Dispatch Vehicles (Vehicle 1–5)
export const DISPATCH_VEHICLES = [
  'Vehicle 1',
  'Vehicle 2',
  'Vehicle 3',
  'Vehicle 4',
  'Vehicle 5',
] as const;

export type DispatchVehicle = (typeof DISPATCH_VEHICLES)[number];

// Strongly typed table entities for application use
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type Department = Tables<'departments'>;
export type DepartmentInsert = TablesInsert<'departments'>;
export type DepartmentUpdate = TablesUpdate<'departments'>;

export type IncidentCategory = Tables<'incident_categories'>;
export type IncidentCategoryInsert = TablesInsert<'incident_categories'>;
export type IncidentCategoryUpdate = TablesUpdate<'incident_categories'>;

export type Incident = Tables<'incidents'>;
export type IncidentInsert = TablesInsert<'incidents'>;
export type IncidentUpdate = TablesUpdate<'incidents'>;

export type IncidentAttachment = Tables<'incident_attachments'>;
export type IncidentAttachmentInsert = TablesInsert<'incident_attachments'>;
export type IncidentAttachmentUpdate = TablesUpdate<'incident_attachments'>;

export type IncidentAssignment = Tables<'incident_assignments'>;
export type IncidentAssignmentInsert = TablesInsert<'incident_assignments'>;
export type IncidentAssignmentUpdate = TablesUpdate<'incident_assignments'>;

export type IncidentUpdateEntry = Tables<'incident_updates'>;
export type IncidentUpdateInsert = TablesInsert<'incident_updates'>;
export type IncidentUpdateUpdate = TablesUpdate<'incident_updates'>;

export type Notification = Tables<'notifications'>;
export type NotificationInsert = TablesInsert<'notifications'>;
export type NotificationUpdate = TablesUpdate<'notifications'>;

export type AuditLog = Tables<'audit_logs'>;
export type AuditLogInsert = TablesInsert<'audit_logs'>;
