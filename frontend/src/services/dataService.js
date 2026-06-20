/**
 * Barrel re-export — all consumers continue to import from this file.
 * Individual domain modules live in ./[domain].service.js
 */
export { masters, initMasters }                                      from './masters.service'
export { getJobs, getJob, getJobSync, getJobPipelineSync,
         createJob, updateJob, deleteJob, getTeamMembers,
         getMatchingCandidates, savePipeline,
         buildPipelineFromCandidates }                                from './jobs.service'
export { getDashboard, getDashboardCandidates,
         getDashboardTodayTasks, getDashboardScheduleEvents }        from './dashboard.service'
export { getCandidateById, getCandidateList,
         createCandidate, updateCandidate }                          from './candidates.service'
export { getInterviewList, getInterviewers, getEligibleInterviewers,
         getInterviewGroups, createInterviewGroup,
         updateInterviewGroup, deleteInterviewGroup }                from './interviews.service'
export { getClients, addClient, updateClient,
         deleteClient, getClientById }                               from './clients.service'
export { getUsers, getUserById, addUser, updateUser,
         deleteUser, getUserRoles, getUserDepartments }              from './users.service'
export { getCalendarEvents, addCalEvent,
         updateCalEvent, deleteCalEvent }                            from './calendar.service'
export { getReportData }                                             from './reports.service'
