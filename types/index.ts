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
