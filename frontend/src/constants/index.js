// ── App Routes ───────────────────────────────────────────────
export const ROUTES = {
  HOME:                '/',
  JOB_OPENINGS:        '/job-openings',
  JOB_OPENING_DETAIL:  (id) => `/job-openings/${id}`,
  JOB_OPENING_EDIT:    (id) => `/job-openings/${id}/edit`,
  CANDIDATES:          '/candidates',
  CANDIDATE_NEW:       '/candidates/new',
  CANDIDATE_EDIT:      (id) => `/candidates/${id}/edit`,
  INTERVIEWS:          '/interviews',
  CLIENT:              '/client',
  CLIENT_NEW:          '/client/new',
  CLIENT_EDIT:         (id) => `/client/${id}/edit`,
  REPORTS:             '/reports',
  CALENDAR:            '/calendar',
  USER_ROLES:          '/user-roles',
  LOGIN:               '/login',
}

// ── Pipeline Stages ──────────────────────────────────────────
export const STAGES = {
  ADDED:            'Added',
  SOURCED:          'Sourced',
  PRE_SCREENING:    'Pre-Screening',
  ASSESSMENT:       'Assessment',
  CLIENT_INTERVIEW: 'Client Interview',
  OFFER:            'Offer',
  REJECTED:         'Rejected',
}

// ── Job Statuses ─────────────────────────────────────────────
export const JOB_STATUSES = {
  ACTIVE:   'Active',
  CLOSED:   'Closed',
  ON_HOLD:  'On Hold',
  DRAFT:    'Draft',
}

// ── Candidate Statuses ───────────────────────────────────────
export const CANDIDATE_STATUSES = {
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
}

// ── Candidate Sub-Statuses (granular stage status) ───────────
export const SUB_STATUSES = {
  // Sourced
  NEWLY_SOURCED:            'Newly Sourced',
  CONTACT_PENDING:          'Contact Pending',
  CONTACTED:                'Contacted',
  // Pre-Screening
  ACCOUNT_CREATED:          'Account Created',
  VERIFICATION_PENDING:     'Verification Pending',
  DOCUMENTS_SUBMITTED:      'Documents Submitted',
  AWAITING_ADMIN_APPROVAL:  'Awaiting Admin Approval',
  REUPLOAD_REQUIRED:        'Re-upload Required',
  VERIFICATION_APPROVED:    'Verification Approved',
  VERIFICATION_REJECTED:    'Verification Rejected',
  // Assessment
  ASSESSMENT_ASSIGNED:      'Assessment Assigned',
  ASSESSMENT_IN_PROGRESS:   'Assessment In Progress',
  ASSESSMENT_COMPLETED:     'Assessment Completed',
  ASSESSMENT_PASSED:        'Assessment Passed',
  ASSESSMENT_FAILED:        'Assessment Failed',
  // Client Interview
  INTERVIEW_SCHEDULED:      'Interview Scheduled',
  INTERVIEW_COMPLETED:      'Interview Completed',
  AWAITING_FEEDBACK:        'Awaiting Feedback',
  INTERVIEW_SELECTED:       'Selected',
  INTERVIEW_REJECTED:       'Rejected',
  // Offer
  OFFER_DRAFTING:           'Offer Drafting',
  OFFER_SENT:               'Offer Sent',
  OFFER_ACCEPTED:           'Offer Accepted',
  OFFER_REJECTED:           'Offer Rejected',
}

// Initial sub-status assigned when a candidate first enters a stage
export const STAGE_INITIAL_SUBSTATUS = {
  'Sourced':          'Newly Sourced',
  'Pre-Screening':    'Verification Pending',
  'Assessment':       'Assessment Assigned',
  'Client Interview': 'Interview Scheduled',
  'Offer':            'Offer Drafting',
}

// ── Interview Types ──────────────────────────────────────────
export const INTERVIEW_TYPES = {
  TECHNICAL:   'Technical',
  HR:          'HR',
  MANAGERIAL:  'Managerial',
}

// ── Client Statuses ──────────────────────────────────────────
export const CLIENT_STATUSES = {
  ACTIVE:   'Active',
  ON_HOLD:  'On Hold',
  INACTIVE: 'Inactive',
}

// ── User Roles ───────────────────────────────────────────────
export const USER_ROLES = [
  'Super Admin', 'Admin', 'CEO', 'Director', 'Department Head',
  'Hiring Manager', 'Operations Manager', 'Team Lead', 'Recruiter',
  'Interview Panel Member', 'Account Manager', 'Client Manager', 'Viewer',
]

// ── Pagination Defaults ──────────────────────────────────────
export const PAGE_SIZES = [10, 25, 50]
export const DEFAULT_PAGE_SIZE = 10
