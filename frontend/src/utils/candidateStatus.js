/**
 * Derives the granular sub-status of a candidate from whatever data is available.
 * Works for both pipeline entries (may lack auditTrail) and full candidate records.
 *
 * Priority: explicit subStatus field > verificationStatus > auditTrail events > stage default
 */
export function deriveSubStatus(candidate) {
  if (!candidate) return '—'

  const { stage, status, subStatus, verificationStatus, auditTrail = [] } = candidate

  // Failed always wins — must come before the persisted subStatus check because
  // handleMove marks status:'Failed' without clearing the old subStatus.
  if (status === 'Failed') {
    if (stage === 'Assessment')       return 'Assessment Failed'
    if (stage === 'Client Interview') return 'Rejected'
    return 'Rejected'
  }

  // Use persisted subStatus if already set and not the generic fallback
  if (subStatus && subStatus !== 'In Progress') return subStatus

  switch (stage) {
    case 'Sourced': {
      if (auditTrail.some(e => /contacted/i.test(e.action))) return 'Contacted'
      if (auditTrail.some(e => /contact pending/i.test(e.action))) return 'Contact Pending'
      return 'Newly Sourced'
    }

    case 'Pre-Screening': {
      if (verificationStatus === 'Approved')           return 'Verification Approved'
      if (verificationStatus === 'Rejected')           return 'Verification Rejected'
      if (verificationStatus === 'Re-upload Required') return 'Re-upload Required'
      if (verificationStatus === 'Pending Verification') return 'Awaiting Admin Approval'
      if (auditTrail.some(e => /document uploaded/i.test(e.action))) return 'Documents Submitted'
      if (auditTrail.some(e => /portal account created/i.test(e.action))) return 'Account Created'
      return 'Verification Pending'
    }

    case 'Assessment': {
      if (auditTrail.some(e => /assessment passed/i.test(e.action)))       return 'Assessment Passed'
      if (auditTrail.some(e => /assessment completed/i.test(e.action)))    return 'Assessment Completed'
      if (auditTrail.some(e => /assessment in progress/i.test(e.action)))  return 'Assessment In Progress'
      return 'Assessment Assigned'
    }

    case 'Client Interview': {
      if (auditTrail.some(e => /interview selected|candidate selected/i.test(e.action))) return 'Selected'
      if (auditTrail.some(e => /interview rejected/i.test(e.action)))      return 'Rejected'
      if (auditTrail.some(e => /interview completed/i.test(e.action)))     return 'Awaiting Feedback'
      return 'Interview Scheduled'
    }

    case 'Offer': {
      if (auditTrail.some(e => /offer rejected/i.test(e.action)))  return 'Offer Rejected'
      if (auditTrail.some(e => /offer accepted/i.test(e.action)))  return 'Offer Accepted'
      if (auditTrail.some(e => /offer sent/i.test(e.action)))      return 'Offer Sent'
      return 'Offer Drafting'
    }

    case 'Added':
      return 'Newly Added'

    default:
      return status || 'In Progress'
  }
}
