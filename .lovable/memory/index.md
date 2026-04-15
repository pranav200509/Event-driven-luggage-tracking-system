# Project Memory

## Core
SkyTrack: Smart Flight Passenger Luggage Tracking for Indian Airlines. College project.
Cloud White palette, Space Grotesk headings, Inter body. Aviation theme.
Lovable Cloud (Supabase) backend. 5 airports: MAA, BLR, HYD, DEL, BOM.
PNR format: SKYIND001-SKYIND012. All checkin_status start as not_checked_in.
Auth: 3 roles (admin, checkin_staff, baggage_staff). Signup disabled. Admin creates staff via edge function.
Role-based routing: /admin, /checkin, /baggage. Airport-based access per staff.

## Memories
- [DB Schema](mem://features/db-schema) — airports and pnr_records tables, checkin_status enum, FK constraints
- [Auth System](mem://features/auth) — user_roles table, profiles, has_role function, manage-staff edge function, RBAC
