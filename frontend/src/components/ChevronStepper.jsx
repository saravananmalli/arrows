import React, { memo } from 'react'
import Stepper from './Stepper'

const STAGES = ['Added', 'Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer']

const ChevronStepper = memo(function ChevronStepper({ activeStage }) {
  const isRejected = activeStage === 'Rejected'
  const activeIdx  = isRejected ? -1 : STAGES.indexOf(activeStage)
  return (
    <div className="pipe-stepper">
      <Stepper steps={STAGES} active={activeIdx} rejected={isRejected} />
    </div>
  )
})

export default ChevronStepper
