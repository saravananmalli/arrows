import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  getInterviewGroups, getInterviewers,
  createInterviewGroup, updateInterviewGroup, deleteInterviewGroup,
} from '../../services/dataService'
import CreateGroupDrawer from './CreateGroupDrawer'
import RoundDrawer from './RoundDrawer'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'

// ── Icons ────────────────────────────────────────────────────────────────────

const IcoChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 8l5 5 5-5"/>
  </svg>
)

const IcoChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M8 5l5 5-5 5"/>
  </svg>
)

const IcoAdd = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IcoDelete = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)


// ── Round badge ───────────────────────────────────────────────────────────────

const ROUND_CLASS = {
  'Round 1': 'r1',
  'Round 2': 'r2',
  'Round 3': 'r3',
}

const RoundBadge = memo(({ round }) => {
  const mod = ROUND_CLASS[round] ?? 'default'
  return (
    <span className={`ig-round-badge ig-round-badge--${mod}`}>
      {round}
    </span>
  )
})

// ── Single round row in left panel ───────────────────────────────────────────

const RoundItem = memo(({ roundName, isActive, onSelect, onEdit, onDelete }) => (
  <div
    className={`ig-round-item${isActive ? ' active' : ''}`}
    onClick={() => onSelect(roundName)}
  >
    <span className="ig-round-item-name">{roundName}</span>
    <div className="ig-round-item-actions">
      <button
        className="ig-action-btn"
        onClick={e => { e.stopPropagation(); onEdit(roundName) }}
        title="Edit round"
      >
        <IcoEdit />
      </button>
      <button
        className="ig-action-btn del"
        onClick={e => { e.stopPropagation(); onDelete(roundName) }}
        title="Delete round"
      >
        <IcoDelete />
      </button>
    </div>
  </div>
))

// ── Group list item in left panel ────────────────────────────────────────────

const GroupItem = memo(({ group, isActive, isExpanded, rounds, activeRound, onSelect, onToggleExpand, onDelete, onEdit, onAddRound, onSelectRound, onEditRound, onDeleteRound }) => (
  <div className={`ig-group-item${isActive ? ' active' : ''}`}>
    <div className="ig-group-header" onClick={() => { onSelect(group); onToggleExpand(group.id) }}>
      <button
        className="ig-expand-btn"
        onClick={e => { e.stopPropagation(); onToggleExpand(group.id) }}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <IcoChevronDown /> : <IcoChevronRight />}
      </button>
      <span className="ig-group-name">{group.name}</span>
      <div className="ig-group-actions">
        <button
          className="ig-action-btn"
          onClick={e => { e.stopPropagation(); onAddRound(group) }}
          title="Add round"
        >
          <IcoAdd />
        </button>
        <button
          className="ig-action-btn"
          onClick={e => { e.stopPropagation(); onEdit(group) }}
          title="Edit group"
        >
          <IcoEdit />
        </button>
        <button
          className="ig-action-btn del"
          onClick={e => { e.stopPropagation(); onDelete(group) }}
          title="Delete group"
        >
          <IcoDelete />
        </button>
      </div>
    </div>
    {isExpanded && rounds.length > 0 && (
      <div className="ig-rounds-list">
        {rounds.map(r => (
          <RoundItem
            key={r}
            roundName={r}
            isActive={isActive && activeRound === r}
            onSelect={onSelectRound}
            onEdit={rn => onEditRound(group, rn)}
            onDelete={rn => onDeleteRound(group, rn)}
          />
        ))}
      </div>
    )}
  </div>
))

// ── Member table row ─────────────────────────────────────────────────────────

const MemberRow = memo(({ member, onRemove }) => (
  <tr>
    <td className="td-name">{member.name}</td>
    <td>{member.email}</td>
    <td>{member.mobile}</td>
    <td><RoundBadge round={member.round} /></td>
    <td>{member.designation}</td>
    <td>
      <span className={`ig-avail${member.available ? ' yes' : ' no'}`}>
        {member.available ? 'Yes' : 'No'}
      </span>
    </td>
    <td>
      <button className="ig-delete-row-btn" onClick={() => onRemove(member.interviewerId)} title="Remove member">
        <IcoDelete />
      </button>
    </td>
  </tr>
))

// ── Main component ────────────────────────────────────────────────────────────

export default function InterviewGroup() {
  const [groups,             setGroups]             = useState([])
  const [interviewerMap,     setInterviewerMap]     = useState({})
  const [activeGroupId,      setActiveGroupId]      = useState(null)
  const [activeRound,        setActiveRound]        = useState(null)
  const [expandedIds,        setExpandedIds]        = useState(new Set())
  const [showCreate,         setShowCreate]         = useState(false)
  const [editGroup,          setEditGroup]          = useState(null)
  const [deleteTarget,       setDeleteTarget]       = useState(null)
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null)
  const [savingGroup,        setSavingGroup]        = useState(false)
  // Round drawer state: { group, roundName } — roundName=null means "add new round"
  const [roundDrawer,        setRoundDrawer]        = useState(null)
  const [savingRound,        setSavingRound]        = useState(false)
  // Delete round state: { group, roundName }
  const [deleteRoundTarget,  setDeleteRoundTarget]  = useState(null)
  const showToast = useToast()

  useEffect(() => {
    Promise.all([getInterviewGroups(), getInterviewers()]).then(([grps, ivs]) => {
      setGroups(grps)
      setInterviewerMap(Object.fromEntries(ivs.map(iv => [iv.id, iv])))
      if (grps.length > 0) {
        setActiveGroupId(grps[0].id)
        setExpandedIds(new Set([grps[0].id]))
      }
    })
  }, [])

  const activeGroup = useMemo(
    () => groups.find(g => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  )

  const activeMembers = useMemo(() => {
    if (!activeGroup) return []
    const members = activeRound
      ? activeGroup.members.filter(m => m.round === activeRound)
      : activeGroup.members
    return members
      .map(m => {
        const iv = interviewerMap[m.interviewerId]
        if (!iv) return null
        return { ...iv, interviewerId: m.interviewerId, round: m.round }
      })
      .filter(Boolean)
  }, [activeGroup, activeRound, interviewerMap])

  const editMembers = useMemo(() => {
    if (!editGroup) return []
    return editGroup.members.map(m => interviewerMap[m.interviewerId]).filter(Boolean)
  }, [editGroup, interviewerMap])

  const groupRounds = useCallback(group =>
    [...new Set((group.members ?? []).map(m => m.round))].sort(),
  [])

  const handleSelect = useCallback(group => {
    setActiveGroupId(group.id)
    setActiveRound(null)
  }, [])

  const handleSelectRound = useCallback(roundName => {
    setActiveRound(prev => prev === roundName ? null : roundName)
  }, [])

  const toggleExpand = useCallback(id => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const closeDrawer = useCallback(() => { setShowCreate(false); setEditGroup(null) }, [])

  const handleSaveGroup = useCallback(async (group, memberDetails, isEdit) => {
    setSavingGroup(true)
    try {
      const saved = isEdit
        ? await updateInterviewGroup(group.id, group)
        : await createInterviewGroup(group)

      setGroups(prev =>
        isEdit ? prev.map(g => g.id === saved.id ? saved : g) : [...prev, saved]
      )
      setInterviewerMap(prev => {
        const next = { ...prev }
        memberDetails.forEach(iv => { next[iv.id] = iv })
        return next
      })
      if (!isEdit) {
        setActiveGroupId(saved.id)
        setExpandedIds(prev => new Set([...prev, saved.id]))
      }
      showToast(isEdit ? 'Group updated successfully' : 'Group created successfully')
      setShowCreate(false)
      setEditGroup(null)
    } catch (err) {
      showToast(err.message || 'Failed to save interview group', 'error')
    } finally {
      setSavingGroup(false)
    }
  }, [showToast])

  const handleDeleteGroup = useCallback(async () => {
    const target = deleteTarget
    try {
      await deleteInterviewGroup(target.id)
      setGroups(prev => {
        const next = prev.filter(g => g.id !== target.id)
        if (activeGroupId === target.id) {
          setActiveGroupId(next[0]?.id ?? null)
          setActiveRound(null)
        }
        return next
      })
      showToast('Group deleted successfully')
    } catch (err) {
      showToast(err.message || 'Failed to delete interview group', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, activeGroupId, showToast])

  const handleRemoveMember = useCallback(async () => {
    const group = groups.find(g => g.id === activeGroupId)
    if (!group) { setRemoveMemberTarget(null); return }
    const members = (group.members ?? []).filter(m => m.interviewerId !== removeMemberTarget)
    try {
      const saved = await updateInterviewGroup(activeGroupId, { ...group, members })
      setGroups(prev => prev.map(g => g.id === activeGroupId ? saved : g))
      showToast('Member removed successfully')
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error')
    } finally {
      setRemoveMemberTarget(null)
    }
  }, [groups, activeGroupId, removeMemberTarget, showToast])

  // ── Round CRUD ──────────────────────────────────────────────────────────────

  const handleSaveRound = useCallback(async (newRoundName, selectedInterviewerIds) => {
    const { group, roundName: oldRoundName } = roundDrawer
    const isEdit = !!oldRoundName
    setSavingRound(true)
    try {
      // Keep all members NOT in the old round, then add the new set
      const existingOtherMembers = (group.members ?? []).filter(m => m.round !== oldRoundName)
      const newRoundMembers = selectedInterviewerIds.map(id => ({
        interviewerId: id,
        round: newRoundName,
      }))
      const updatedGroup = { ...group, members: [...existingOtherMembers, ...newRoundMembers] }
      const saved = await updateInterviewGroup(group.id, updatedGroup)
      setGroups(prev => prev.map(g => g.id === saved.id ? saved : g))
      if (activeGroupId === group.id && activeRound === oldRoundName) {
        setActiveRound(newRoundName)
      }
      setExpandedIds(prev => new Set([...prev, group.id]))
      showToast(isEdit ? 'Round updated successfully' : 'Round added successfully')
      setRoundDrawer(null)
    } catch (err) {
      showToast(err.message || 'Failed to save round', 'error')
    } finally {
      setSavingRound(false)
    }
  }, [roundDrawer, activeGroupId, activeRound, showToast])

  const handleDeleteRound = useCallback(async () => {
    const { group, roundName } = deleteRoundTarget
    try {
      const members = (group.members ?? []).filter(m => m.round !== roundName)
      const saved = await updateInterviewGroup(group.id, { ...group, members })
      setGroups(prev => prev.map(g => g.id === saved.id ? saved : g))
      if (activeGroupId === group.id && activeRound === roundName) {
        setActiveRound(null)
      }
      showToast('Round deleted successfully')
    } catch (err) {
      showToast(err.message || 'Failed to delete round', 'error')
    } finally {
      setDeleteRoundTarget(null)
    }
  }, [deleteRoundTarget, activeGroupId, activeRound, showToast])

  return (
    <div className="ig-wrap">

      {(showCreate || editGroup) && (
        <CreateGroupDrawer
          onClose={closeDrawer}
          onSave={handleSaveGroup}
          saving={savingGroup}
          initialGroup={editGroup}
          initialMembers={editMembers}
        />
      )}

      {roundDrawer && (
        <RoundDrawer
          group={roundDrawer.group}
          roundName={roundDrawer.roundName}
          onClose={() => setRoundDrawer(null)}
          onSave={handleSaveRound}
          saving={savingRound}
          interviewerMap={interviewerMap}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete the group "${deleteTarget.name}"? All member assignments will be removed.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteRoundTarget && (
        <ConfirmModal
          message={`Delete the round "${deleteRoundTarget.roundName}" from "${deleteRoundTarget.group.name}"? All interviewers assigned to this round will be removed.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteRound}
          onCancel={() => setDeleteRoundTarget(null)}
        />
      )}

      {removeMemberTarget && (
        <ConfirmModal
          message="Remove this member from the group?"
          confirmLabel="Remove"
          onConfirm={handleRemoveMember}
          onCancel={() => setRemoveMemberTarget(null)}
        />
      )}

      {/* Left panel */}
      <div className="ig-left-panel">
        <div className="ig-left-header">
          <span className="ig-left-title">Group / Skill Name</span>
          <button className="btn btn-secondary ig-create-btn" onClick={() => setShowCreate(true)}>
            Create Group
          </button>
        </div>

        <div className="ig-group-list">
          {groups.length === 0 ? (
            <div className="ig-empty-groups">No groups yet. Create one to get started.</div>
          ) : (
            groups.map(group => (
              <GroupItem
                key={group.id}
                group={group}
                isActive={group.id === activeGroupId}
                isExpanded={expandedIds.has(group.id)}
                rounds={groupRounds(group)}
                activeRound={activeRound}
                onSelect={handleSelect}
                onToggleExpand={toggleExpand}
                onDelete={setDeleteTarget}
                onEdit={setEditGroup}
                onAddRound={g => setRoundDrawer({ group: g, roundName: null })}
                onSelectRound={handleSelectRound}
                onEditRound={(g, rn) => setRoundDrawer({ group: g, roundName: rn })}
                onDeleteRound={(g, rn) => setDeleteRoundTarget({ group: g, roundName: rn })}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="ig-right-panel">
        {!activeGroup ? (
          <div className="ig-right-empty">
            <div className="ig-right-empty-text">Select a group to view its members.</div>
          </div>
        ) : (
          <>
            <div className="ig-right-header">
              <div className="ig-right-title">
                {activeGroup.name}
                {activeRound && <span className="ig-active-round-label">/ {activeRound}</span>}
                <span className="ig-member-count-label">(Member {activeMembers.length})</span>
              </div>
              {activeRound && (
                <button
                  className="btn btn-secondary ig-create-btn"
                  onClick={() => setRoundDrawer({ group: activeGroup, roundName: activeRound })}
                >
                  Edit Round
                </button>
              )}
            </div>

            <div className="ig-table-wrap">
              <table className="ig-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Round</th>
                    <th>Designation</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        {activeRound
                          ? `No members assigned to ${activeRound} yet.`
                          : 'No members in this group yet.'}
                      </td>
                    </tr>
                  ) : (
                    activeMembers.map(m => (
                      <MemberRow
                        key={m.interviewerId}
                        member={m}
                        onRemove={id => setRemoveMemberTarget(id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Group meta */}
            <div className="ig-group-meta">
              <span>Primary Skill: <strong>{activeGroup.primarySkill}</strong></span>
              {activeGroup.minExperience > 0 && (
                <span>Min. Experience: <strong>{activeGroup.minExperience} yrs</strong></span>
              )}
              {activeGroup.description && (
                <span>{activeGroup.description}</span>
              )}
              <span>Created by <strong>{activeGroup.createdBy}</strong> on {activeGroup.createdDate}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
