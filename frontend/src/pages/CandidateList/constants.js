import { masters } from '../../services/dataService'

export const STAGE_LEGEND        = masters.stages
export const SOURCE_OPTIONS      = masters.sources
export const RATING_OPTIONS      = masters.ratings
export const STAGE_OPTIONS       = masters.stages.map(s => s.label)
export const STATUS_OPTIONS      = masters.statuses
export const TECH_SUGGESTIONS    = masters.skills.technical
export const SOFT_SUGGESTIONS    = masters.skills.soft
