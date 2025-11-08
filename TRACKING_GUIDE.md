# Story Tracking Guide

This guide explains how to track progress on the Document Processing Agent project.

## Quick Reference

### Story Status Indicators
- 📋 **To Do** - Not started
- 🏗️ **In Progress** - Currently being worked on
- ✅ **Done** - Completed and tested
- 🚫 **Blocked** - Cannot proceed due to dependency or issue

### Priority Levels
- **P0 (Critical)** - Must have for MVP, blocks other work
- **P1 (High)** - Important features, should be in initial release
- **P2 (Medium)** - Nice to have, can be deferred

---

## Daily Standup Template

**What I did yesterday:**
- Completed: [Story ID] - [Task name]
- Progress on: [Story ID] - [Current task]

**What I'm doing today:**
- Working on: [Story ID] - [Planned task]
- Goal: Complete [Acceptance Criteria #X]

**Blockers:**
- [Any blockers with story IDs]

---

## How to Update Story Status

### 1. Starting Work on a Story

**In USER_STORIES.md:**
```markdown
**Status:** 🏗️ In Progress
**Assignee:** Your Name
```

**In STORY_TRACKER.json:**
```json
{
  "status": "In Progress",
  "assignee": "Your Name",
  "startDate": "2025-01-08"
}
```

### 2. Completing a Task

**In USER_STORIES.md:**
```markdown
**Technical Tasks:**
- [x] T1: Setup Express.js server (1hr) - DONE
- [ ] T2: Configure Multer (1hr)
```

**In STORY_TRACKER.json:**
```json
{
  "tasks": {
    "total": 11,
    "completed": 1
  }
}
```

### 3. Completing an Acceptance Criteria

**In USER_STORIES.md:**
```markdown
**Acceptance Criteria:**
- [x] AC1: System accepts files via POST
- [ ] AC2: Validates file type
```

**In STORY_TRACKER.json:**
```json
{
  "acceptanceCriteria": {
    "total": 10,
    "completed": 1
  }
}
```

### 4. Completing a Story

**In USER_STORIES.md:**
```markdown
**Status:** ✅ Done
**Completed Date:** 2025-01-10

**Definition of Done:**
- [x] Code reviewed and approved
- [x] All acceptance criteria met
- [x] Unit tests passing
- [x] Integration tests passing
- [x] API documented
- [x] Deployed to dev
```

**In STORY_TRACKER.json:**
```json
{
  "status": "Done",
  "completedDate": "2025-01-10",
  "acceptanceCriteria": {
    "total": 10,
    "completed": 10
  },
  "tasks": {
    "total": 11,
    "completed": 11
  }
}
```

### 5. Marking a Story as Blocked

**In USER_STORIES.md:**
```markdown
**Status:** 🚫 Blocked
**Blockers:**
- Waiting for Claude API key approval
- Need clarification on auth requirements
```

**In STORY_TRACKER.json:**
```json
{
  "status": "Blocked",
  "blockers": [
    "Waiting for Claude API key approval",
    "Need clarification on auth requirements"
  ]
}
```

---

## Sprint Progress Tracking

### At Sprint Start

1. Update sprint dates in STORY_TRACKER.json:
```json
{
  "sprints": [
    {
      "id": "sprint-1",
      "startDate": "2025-01-08",
      "endDate": "2025-01-22",
      "status": "Active"
    }
  ]
}
```

2. Assign stories to team members
3. Set up sprint board (Trello, Jira, or GitHub Projects)

### Daily Updates

Update the following in STORY_TRACKER.json:
- Story status (To Do → In Progress → Done)
- Completed tasks count
- Completed acceptance criteria count
- Blockers

### At Sprint End

1. Calculate velocity:
```json
{
  "velocity": {
    "sprint1": 24,
    "average": 24
  }
}
```

2. Update sprint status:
```json
{
  "sprints": [
    {
      "id": "sprint-1",
      "status": "Completed",
      "completedPoints": 24
    }
  ]
}
```

3. Move incomplete stories to next sprint

---

## Burndown Tracking

### Manual Burndown Chart (Daily Update)

Create a simple CSV or spreadsheet:

| Date | Remaining Points | Completed Points |
|------|------------------|------------------|
| 2025-01-08 | 26 | 0 |
| 2025-01-09 | 24 | 2 |
| 2025-01-10 | 19 | 7 |
| ... | ... | ... |

### Ideal Burndown Calculation

For Sprint 1 (26 points, 10 working days):
- Day 1: 26 points remaining
- Day 2: 23.4 points remaining
- Day 3: 20.8 points remaining
- ...
- Day 10: 0 points remaining

---

## Testing Checklist

For each story, ensure:

### Unit Tests
- [ ] All functions have unit tests
- [ ] Edge cases covered
- [ ] Error cases tested
- [ ] Coverage > 80%

### Integration Tests
- [ ] API endpoint tested end-to-end
- [ ] Authentication tested
- [ ] Error responses tested
- [ ] Sample data tests passing

### Manual QA
- [ ] Happy path tested manually
- [ ] Error scenarios tested
- [ ] Performance benchmarks met
- [ ] Documentation accurate

---

## Code Review Checklist

Before marking a story as "Done":

### Code Quality
- [ ] No console.log statements (use logger)
- [ ] No hardcoded values (use config/env)
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] No security vulnerabilities

### Testing
- [ ] Tests written and passing
- [ ] Coverage meets minimum (80%)
- [ ] Edge cases covered

### Documentation
- [ ] API endpoint documented
- [ ] Code comments for complex logic
- [ ] README updated if needed
- [ ] CHANGELOG entry added

### Performance
- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] Memory leaks checked

---

## Metrics Dashboard (Weekly Update)

Track these metrics weekly:

### Velocity
```
Sprint 1: 24 points
Sprint 2: 28 points
Sprint 3: 26 points
Average: 26 points/sprint
```

### Story Completion Rate
```
Completed: 12/20 = 60%
In Progress: 3/20 = 15%
To Do: 5/20 = 25%
```

### By Epic Progress
```
Epic 1: 3/3 stories = 100% ✅
Epic 2: 3/4 stories = 75%
Epic 3: 2/4 stories = 50%
Epic 4: 0/3 stories = 0%
Epic 5: 0/4 stories = 0%
Epic 6: 0/2 stories = 0%
```

### Technical Debt
- Number of TODO comments: X
- Number of skipped tests: X
- Known bugs: X

---

## GitHub Issues Integration (Optional)

If using GitHub Issues for tracking:

### Create Issue Template

```markdown
---
name: User Story
about: Track user story implementation
labels: user-story
---

## Story: [ID] - [Title]

**Priority:** P0/P1/P2
**Story Points:** X
**Sprint:** Sprint X
**Epic:** Epic Name

### User Story
As a [role]
I want [feature]
So that [benefit]

### Acceptance Criteria
- [ ] AC1: ...
- [ ] AC2: ...

### Technical Tasks
- [ ] T1: ...
- [ ] T2: ...

### Definition of Done
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documented
- [ ] Deployed to dev

### Dependencies
- #issue-number (US-XXX)
```

### Labels to Use
- `epic:upload` - Epic 1
- `epic:extraction` - Epic 2
- `epic:generation` - Epic 3
- `epic:performance` - Epic 4
- `epic:integration` - Epic 5
- `epic:quality` - Epic 6
- `priority:p0` - Critical
- `priority:p1` - High
- `priority:p2` - Medium
- `status:todo` - Not started
- `status:in-progress` - In progress
- `status:blocked` - Blocked
- `sprint:1` - Sprint 1
- `sprint:2` - Sprint 2

---

## Risk Management

### Weekly Risk Review

For each risk in STORY_TRACKER.json:

1. **Review probability** - Has it changed?
2. **Review impact** - Still accurate?
3. **Check mitigation** - Is it being implemented?
4. **Update status** - Open/Mitigated/Closed

### Adding a New Risk

**In STORY_TRACKER.json:**
```json
{
  "risks": [
    {
      "id": "R5",
      "title": "Database Performance Degradation",
      "impact": "Medium",
      "probability": "Low",
      "mitigation": "Add indexes, implement connection pooling, monitor query performance",
      "status": "Open",
      "identifiedDate": "2025-01-15",
      "owner": "Backend Team"
    }
  ]
}
```

---

## Quick Commands

### View All To Do Stories
```bash
grep -A 5 "Status: 📋 To Do" USER_STORIES.md
```

### View All In Progress Stories
```bash
grep -A 5 "Status: 🏗️ In Progress" USER_STORIES.md
```

### Count Completed Acceptance Criteria
```bash
grep -c "\[x\] AC" USER_STORIES.md
```

### Count Total Acceptance Criteria
```bash
grep -c "\[ \] AC\|\[x\] AC" USER_STORIES.md
```

---

## Example: Completing US-001

### Day 1 (Starting the story)

**USER_STORIES.md:**
```markdown
### US-001: Document Upload API
**Status:** 🏗️ In Progress
**Assignee:** John Doe
**Start Date:** 2025-01-08
```

**Daily update:**
- Started work on US-001
- Completed T1: Setup Express.js server
- Working on T2: Configure Multer

### Day 2

**USER_STORIES.md:**
```markdown
**Technical Tasks:**
- [x] T1: Setup Express.js server (1hr)
- [x] T2: Configure Multer (1hr)
- [x] T3: Create file validation middleware (2hr)
- [ ] T4: Implement filename sanitization (30min)
...

**Acceptance Criteria:**
- [x] AC1: System accepts files via POST
- [x] AC2: Validates file type
- [ ] AC3: Validates file size
...
```

**Daily update:**
- Completed T2, T3
- Met AC1, AC2
- Working on file size validation

### Day 3 (Completing the story)

**USER_STORIES.md:**
```markdown
### US-001: Document Upload API
**Status:** ✅ Done
**Completed Date:** 2025-01-10

**Acceptance Criteria:**
- [x] AC1: System accepts files via POST
- [x] AC2: Validates file type
- [x] AC3: Validates file size
... (all checked)

**Definition of Done:**
- [x] Code reviewed and approved
- [x] All acceptance criteria met
- [x] Unit tests passing (coverage 85%)
- [x] Integration tests passing
- [x] API documented
- [x] Deployed to dev
```

**STORY_TRACKER.json:**
```json
{
  "id": "US-001",
  "status": "Done",
  "completedDate": "2025-01-10",
  "acceptanceCriteria": {
    "total": 10,
    "completed": 10
  },
  "tasks": {
    "total": 11,
    "completed": 11
  }
}
```

**Update metrics:**
```json
{
  "metrics": {
    "totalStories": 20,
    "completedStories": 1,
    "completedPoints": 5,
    "percentComplete": 5
  }
}
```

---

## Tips for Success

### 1. Update Daily
- Don't let tracking lag behind actual work
- Update at the end of each day (5 minutes)
- Keep STORY_TRACKER.json in sync with reality

### 2. Be Honest About Status
- Don't mark things done if they're not truly done
- If blocked, mark it immediately and escalate
- If a story is taking longer, update the estimate

### 3. Use Definition of Done
- Don't skip any items in the DoD
- Every story must meet the same quality bar
- No exceptions for "quick fixes"

### 4. Track Time Spent
- Keep notes on actual time vs. estimated time
- Use this to improve future estimates
- Identify areas where you're consistently over/under

### 5. Review Dependencies
- Check dependencies before starting a story
- Don't start stories that depend on incomplete work
- Update STORY_TRACKER.json if dependencies change

---

## Troubleshooting

### Story is blocked
1. Document the blocker clearly
2. Assign someone to resolve it
3. Pick up another story if possible
4. Escalate if blocker persists > 2 days

### Story is taking too long
1. Break it down into smaller tasks
2. Consider splitting into multiple stories
3. Ask for help/pair programming
4. Review scope - is it too large?

### Tests are failing
1. Don't mark story as done
2. Keep status as "In Progress"
3. Fix tests before moving on
4. Update acceptance criteria if tests reveal gaps

### Merge conflicts
1. Resolve immediately
2. Don't let branches diverge too long
3. Merge main into feature branch daily
4. Communicate with team about overlapping work

---

## Contact & Support

**Questions about:**
- User stories: Check USER_STORIES.md
- Tracking: Check this guide
- Technical implementation: Check API documentation
- Sprint planning: Scrum master / product owner

**Need help?**
1. Check documentation first
2. Ask in team chat
3. Schedule pairing session
4. Escalate to lead if blocked > 1 day
