# Feature 1: Field Operations Hub

**Purpose**: Enable field and shop crews to manage daily operations, access project documents, and report progress on their assigned jobs.

**User Flow**:

1. Worker logs in and selects their job and location (Field or Shop)
2. Views today's schedule and assigned tasks for that specific job
3. Accesses blueprints, marks them up, and saves annotations
4. Completes daily reports (inspections, NCRs, safety procedures)
5. Tracks time and production metrics per job

## Frontend Requirements

**UI Components**:

- Job selector with Field/Shop location toggle
- Task cards with status indicators
- Blueprint viewer with markup tools
- Form builder for daily reports
- Time clock interface
- Document browser with folder navigation

**Pages/Layout**:

- `/jobs` - Job selection screen
- `/job/[id]/dashboard` - Job-specific dashboard
- `/job/[id]/blueprints` - Blueprint viewer
- `/job/[id]/reports` - Daily reporting forms
- `/job/[id]/documents` - Document management

**State Management**:

- Current job and location context
- Blueprint markup data
- Form progress auto-save
- Offline capability for field use

**User Experience**:

- Mobile-first responsive design
- Offline mode with sync when connected
- Quick action buttons for common tasks
- Visual job/location indicator always visible

## Backend Requirements

**API Endpoints**:

- `GET /api/jobs/active` - User's assigned jobs
- `POST /api/jobs/select` - Select job and location
- `GET /api/jobs/[id]/schedule` - Job-specific tasks
- `GET /api/blueprints/[id]` - Load blueprint
- `PUT /api/blueprints/[id]/markup` - Save annotations
- `POST /api/reports` - Submit daily reports
- `POST /api/time/clock` - Clock in/out with job context

**Database Models**:

```prisma
model Job {
  id          String   @id @default(cuid())
  name        String
  client      String
  status      String   // ACTIVE, COMPLETE, ON_HOLD
  fieldCrews  CrewAssignment[]
  shopCrews   CrewAssignment[]
  blueprints  Blueprint[]
  reports     Report[]
}

model CrewAssignment {
  id         String   @id @default(cuid())
  jobId      String
  location   String   // FIELD or SHOP
  crewId     String
  active     Boolean
}

model Blueprint {
  id         String   @id @default(cuid())
  jobId      String
  url        String
  markups    Json
  version    Int
}

model Report {
  id         String   @id @default(cuid())
  type       String   // DAILY, INSPECTION, NCR, SAFETY
  jobId      String
  location   String   // FIELD or SHOP
  data       Json
  submittedBy String
  status     String
}
```

**Authentication**:

- Role-based access (FIELD, SHOP, FOREMAN, PM, ADMIN)
- Job-specific permissions
- Location-based access control

**Data Validation**:

- Job selection required before access
- Report fields based on type
- File size limits for uploads

## Integration & Flow

**Data Flow**:

1. Job selection persists in session
2. All API calls include job/location context
3. Reports saved with job association
4. Time entries linked to specific job/location

**Error Handling**:

- Offline queue for report submission
- Conflict resolution for blueprint markups
- Auto-retry for failed uploads

**Success Indicators**:

- Workers can access only assigned jobs
- Reports submitted successfully
- Blueprints sync across devices
- Time tracked accurately per job/location

---

# Feature 2: Communication & Coordination Center

**Purpose**: Enable real-time communication between office and field, coordinate schedules, and manage workforce across multiple jobs.

**User Flow**:

1. Project managers view all active jobs and crew assignments
2. Send messages or video call specific crews/workers
3. Update shared calendar with job-specific events
4. Monitor real-time progress across all jobs
5. Manage crew assignments and relocations

## Frontend Requirements

**UI Components**:

- Multi-job dashboard with crew locations
- Chat interface with job context
- Video call component
- Calendar with job filtering
- Notification center
- Admin panels for different roles

**Pages/Layout**:

- `/admin` - Multi-job overview (PM/Admin only)
- `/messages` - Communication hub
- `/calendar` - Shared calendar view
- `/admin/crews` - Crew management
- `/admin/users` - User/role management

**State Management**:

- WebSocket connections for real-time
- Message history per job
- Calendar events subscription
- Active user presence

**User Experience**:

- Real-time message delivery
- Push notifications for urgent items
- Job-context preserved in all communications
- Role-specific dashboards

## Backend Requirements

**API Endpoints**:

- `GET /api/admin/jobs` - All jobs overview
- `POST /api/messages` - Send message with job context
- `GET /api/messages/job/[id]` - Job-specific messages
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/crews/assign` - Reassign crew to job
- `GET /api/ws/connect` - WebSocket for real-time

**Database Models**:

```prisma
model Message {
  id         String   @id @default(cuid())
  jobId      String?  // Optional for general messages
  senderId   String
  content    String
  type       String   // TEXT, VIDEO_CALL, FILE
  recipients String[] // User IDs or "ALL_FIELD", "ALL_SHOP"
  createdAt  DateTime @default(now())
}

model CalendarEvent {
  id         String   @id @default(cuid())
  jobId      String
  title      String
  date       DateTime
  type       String   // MEETING, INSPECTION, DEADLINE
  attendees  String[]
  reminder   Boolean
}

model Crew {
  id         String   @id @default(cuid())
  name       String
  type       String   // FIELD or SHOP
  foremanId  String
  members    String[] // User IDs
}
```

**Authentication**:

- Admin/PM can see all jobs
- Workers see only assigned jobs
- Role-specific message permissions

**Real-time Features**:

- WebSocket broadcast by job channel
- Presence tracking per job
- Live production updates

## Integration & Flow

**Data Flow**:

1. Messages routed by job context
2. Calendar filtered by user's jobs
3. Notifications based on role/job
4. Real-time sync across all clients

**Success Indicators**:

- Instant message delivery
- Calendar events visible to relevant crews
- Crew reassignments reflect immediately
- Office can track all field/shop activities
