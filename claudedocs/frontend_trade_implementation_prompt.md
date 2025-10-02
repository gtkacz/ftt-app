# Frontend Implementation Prompt: Trade & Pick Protection System

## Context

A Django-based fantasy basketball league application has just implemented a comprehensive trade and pick protection system. You need to build the complete frontend UI/UX for this system. The backend provides REST API endpoints for all trade operations.

## Backend Models Overview

### 1. Trade Model
**Purpose**: Main container for multi-team trades

**Key Fields**:
- `proposing_team`: Team that initiated the trade
- `teams`: ManyToMany - all teams involved (2+)
- `status`: draft | proposed | accepted | rejected | cancelled | waiting_approval | approved | completed | vetoed
- `notes`: Optional trade notes
- Timestamps: `created_at`, `proposed_at`, `completed_at`, `approved_at`
- `approved_by`: Commissioner who approved (ForeignKey to User)

**Status Workflow**:
```
draft → proposed → accepted → (waiting_approval) → approved → completed
           ↓           ↓              ↓                ↓
       cancelled   rejected        vetoed          vetoed
```

### 2. TradeOffer Model
**Purpose**: Track each team's response to a trade

**Key Fields**:
- `trade`: ForeignKey to Trade
- `team`: Team making the response
- `status`: pending | accepted | rejected | countered
- `is_proposer`: Boolean - whether this team proposed
- `counter_offer`: Self-referencing FK - links to original offer if this is a counter
- `message`: Optional message with response
- `responded_at`: When team responded

### 3. TradeAsset Model
**Purpose**: Individual assets (players/picks) being traded

**Key Fields**:
- `trade`: ForeignKey to Trade
- `asset_type`: "player" | "pick"
- `giving_team`: Team giving up asset
- `receiving_team`: Team receiving asset
- `player`: ForeignKey to Player (if asset_type="player")
- `pick`: ForeignKey to Pick (if asset_type="pick")

**Pick Protection Fields** (only for picks):
- `pick_protection_type`: "none" | "swap_best" | "swap_worst" | "doesnt_convey"
- `pick_protection_range_start`: Integer (1-30)
- `pick_protection_range_end`: Integer (1-30)
- `pick_swap_target`: ForeignKey to another Pick
- `pick_rollover_year`: Integer (year)

### 4. Pick Model
**Purpose**: Draft capital/assets teams own

**Key Fields**:
- `original_team`: Team that originally owned pick
- `current_team`: Team that currently owns pick
- `draft_year`: Year of draft
- `round_number`: Round number
- `protection_type`: "none" | "swap_best" | "swap_worst" | "doesnt_convey"
- `protection_range_start/end`: For doesnt_convey protections
- `swap_target_pick`: Pick to swap with
- `rollover_year`: Year to roll to if doesn't convey
- `actual_pick_number`: Actual position (1-30) after lottery
- `is_conveyed`: Whether pick transferred or was protected

## Pick Protection Logic

### Protection Types Explained

**1. No Protection (`none`)**
- Pick transfers normally with no conditions

**2. Swap if Best (`swap_best`)**
- If this pick ends up better (lower number) than the swap target, the teams swap picks
- Example: Team A trades their 2025 1st with swap_best protection vs Team B's 2025 1st
  - If Team A gets pick #3 and Team B gets pick #15, they swap → Team A keeps #15, Team B gets #3

**3. Swap if Worst (`swap_worst`)**
- If this pick ends up worse (higher number) than the swap target, the teams swap picks
- Example: Same scenario, Team A would get the worse pick, Team B the better

**4. Doesn't Convey (`doesnt_convey`)**
- If pick falls in protected range, it doesn't transfer and rolls over to future year
- Example: Top-5 protected (range 1-5), rolls to 2026
  - If pick is #3 → doesn't convey, original team keeps it, new pick created for 2026
  - If pick is #12 → conveys normally to receiving team

## Business Rules & Validation

### Trade Validation Rules

1. **Salary Cap Compliance**
   - Calculate net salary change per team: (incoming salary - outgoing salary)
   - `team.total_salary() + net_salary <= LEAGUE_SETTINGS.SALARY_CAP`
   - Display current salary, net change, and remaining cap space

2. **Player Cap Compliance**
   - Calculate net player change: (incoming players - outgoing players)
   - `team.total_players() + net_players <= LEAGUE_SETTINGS.MAX_PLAYER_CAP`
   - Display current roster size, net change, and remaining slots

3. **RFA Player Trading**
   - Players with 0 contract years remaining can ONLY be traded if they have `is_rfa=True`
   - Validate that giving_team owns the RFA rights
   - Display RFA status clearly in player cards

4. **Pick Ownership**
   - Only current_team can trade a pick
   - Validate pick hasn't already been traded in this draft year
   - Show pick history (original owner → current owner)

5. **Multi-Team Trades**
   - Minimum 2 teams, no maximum
   - Each team must give AND receive at least one asset (no "salary dumps")
   - All teams must accept before trade can be approved

### Pick Protection Validation

1. **Swap Protections** (swap_best, swap_worst)
   - Must specify `swap_target_pick`
   - Target must be from same draft year and round
   - Cannot swap pick with itself
   - Both picks must exist and be owned by trading teams

2. **Doesn't Convey Protection**
   - Must specify `protection_range_start` and `protection_range_end`
   - Range start must be ≤ range end
   - Must specify `rollover_year` (must be > draft_year)
   - Clearly explain: "If pick falls between #X-#Y, it stays with original team and new pick created for [rollover_year]"

## Required UI Components & Features

### 1. Trade Creation Interface

**Component**: `TradeComposer` or `TradeBuilder`

**Features**:
- **Team Selection**
  - Dropdown to add teams (2+ teams)
  - Visual representation of all teams involved
  - Clear "proposing team" indicator

- **Asset Management Per Team**
  - Split view: "Giving" | "Receiving" for each team
  - Player selection:
    - Filterable/searchable player list
    - Show: name, position, salary, contract years
    - Highlight RFA players (0 years, is_rfa=true)
    - Disable non-tradeable players
  - Pick selection:
    - Filterable by year, round
    - Show: "2025 1st Round (via LAL)" format
    - Display current ownership chain

- **Pick Protection Configuration**
  - Modal/drawer when adding pick to trade
  - Protection type selector (4 options with tooltips)
  - Conditional fields based on protection type:
    - **swap_best/swap_worst**: Pick selector for swap target
    - **doesnt_convey**: Range inputs (start, end) + rollover year selector
  - Real-time validation feedback
  - Human-readable summary: "Top-5 protected, rolls to 2026 if picks 1-5"

- **Trade Summary Panel**
  - Per-team breakdown:
    - Assets giving up (players + picks)
    - Assets receiving
    - Net salary impact: `+$12M` or `-$5M` with color coding
    - Net roster impact: `+2 players` or `-1 player`
    - Cap compliance status: ✅ Under cap or ❌ Over cap by $X
  - Overall trade fairness indicator (optional)
  - Notes/message textarea

- **Actions**
  - Save as Draft (status: "draft")
  - Propose Trade (status: "proposed", creates TradeOffers)
  - Cancel/Delete (if in draft)

**Validation Display**:
- Real-time validation as assets are added
- Block "Propose" button if validation fails
- Show specific errors:
  - "Lakers would exceed salary cap by $5.2M"
  - "Celtics would exceed player cap by 2 players"
  - "Cannot trade LeBron James - not an RFA with 0 years"
  - "Swap target must be from same draft year"

### 2. Trade Inbox/Dashboard

**Component**: `TradeInbox` or `TradeDashboard`

**Views**:
- **Active Trades** (proposed to me, pending my response)
  - Card per trade with:
    - Proposing team
    - Quick asset summary
    - My response status
    - Time since proposed
    - CTA: "Review Trade"

- **Sent Trades** (I proposed, awaiting others)
  - Card per trade with:
    - Teams involved
    - Response status per team (pending/accepted/rejected)
    - Quick asset summary
    - CTA: "View Details" or "Cancel"

- **Trade History** (completed, rejected, cancelled)
  - Filterable by status
  - Collapsed view with expand for details
  - Show outcome and timestamp

### 3. Trade Review Interface

**Component**: `TradeReview` or `TradeDetailView`

**Features**:
- **Trade Overview**
  - Proposing team and timestamp
  - Full asset breakdown (per-team columns)
  - Protection details for each pick
  - Notes/message from proposer

- **Impact Analysis** (for my team)
  - Before/After comparison:
    - Roster size: `12 → 14`
    - Total salary: `$120M → $115M`
    - Cap space: `$10M → $15M`
  - Player-by-player comparison table
  - Highlighted cap compliance status

- **Response Actions** (if my team is involved)
  - **Accept**: Button with confirmation modal
    - Show: "You are accepting this trade. This cannot be undone until all teams respond."
  - **Reject**: Button with optional message
    - Modal: "Are you sure? This will reject the trade for all teams."
  - **Counter-Offer**: Opens TradeComposer pre-filled with current trade
    - Creates new trade linked via `counter_offer` field
    - Marks this offer as "countered"
  - **Withdraw** (if I proposed): Cancel the entire trade

- **Other Teams' Responses**
  - Status badges per team: Pending | Accepted | Rejected
  - Timestamp of response
  - Message if included

- **Commissioner Actions** (if user is commissioner)
  - Approve/Veto buttons (if trade is in "waiting_approval" status)
  - Override trade status
  - Add approval notes

### 4. Pick Protection Visualization

**Component**: `PickProtectionBadge` and `PickProtectionExplainer`

**Badge Display** (in lists/cards):
- Icon + text based on protection type:
  - `none`: No badge
  - `swap_best`: "🔄 Swap ↑" with tooltip
  - `swap_worst`: "🔄 Swap ↓" with tooltip
  - `doesnt_convey`: "🛡️ Top-5 protected" with tooltip

**Detailed Explainer** (in trade review/pick details):
- Visual diagram showing protection logic
- Examples:
  - "If this pick lands at #1-5, it stays with Lakers and rolls to 2026"
  - "This pick swaps with the Nets 2025 1st if it's better (lower number)"
- Conditional rendering based on protection type
- Color-coded ranges (protected range in red, safe range in green)

### 5. Multi-Team Trade Visualization

**Component**: `TradeFlowDiagram`

**Visual Representation**:
- Node-and-edge diagram or Sankey-style flow
- Each team as a node
- Assets flowing between teams as edges
- Color-coded asset types (players vs picks)
- Hover for asset details
- Mobile-friendly alternative: Accordion per team

### 6. Trade Notifications

**Component**: `TradeNotificationBanner` and notification system integration

**Notification Types**:
- "You have a new trade proposal from [Team]"
- "[Team] accepted your trade proposal"
- "[Team] rejected your trade proposal"
- "[Team] sent a counter-offer"
- "Trade completed: [brief summary]"
- "Commissioner approved trade #123"

**Behavior**:
- Real-time updates (WebSocket or polling)
- Badge count on trade inbox icon
- Toast/banner for immediate actions

## API Interactions

### Expected Endpoints (you may need to create these or adapt)

**Trades**:
```
GET    /api/trades/                    # List trades (filter by status, team)
POST   /api/trades/                    # Create new trade (draft)
GET    /api/trades/:id/                # Get trade details
PATCH  /api/trades/:id/                # Update trade (draft only)
DELETE /api/trades/:id/                # Delete trade (draft only)
POST   /api/trades/:id/propose/        # Propose trade (draft → proposed)
POST   /api/trades/:id/execute/        # Execute trade (admin only)
```

**Trade Offers**:
```
GET    /api/trade-offers/              # List offers (filter by team, status)
GET    /api/trade-offers/:id/          # Get offer details
POST   /api/trade-offers/:id/accept/   # Accept offer
POST   /api/trade-offers/:id/reject/   # Reject offer
POST   /api/trade-offers/:id/counter/  # Create counter-offer
```

**Trade Assets**:
```
POST   /api/trades/:id/assets/         # Add asset to trade (draft only)
DELETE /api/trade-assets/:id/          # Remove asset (draft only)
PATCH  /api/trade-assets/:id/          # Update asset (e.g., change protection)
```

**Picks**:
```
GET    /api/picks/                     # List picks (filter by team, year)
GET    /api/picks/:id/                 # Get pick details with protection
```

**Validation**:
```
POST   /api/trades/validate/           # Validate trade before proposing
                                       # Returns: cap compliance, errors, warnings
```

### Example API Payloads

**Create Trade**:
```json
{
  "proposing_team": 1,
  "teams": [1, 2, 3],
  "notes": "Three-team blockbuster",
  "status": "draft"
}
```

**Add Player Asset**:
```json
{
  "trade": 5,
  "asset_type": "player",
  "giving_team": 1,
  "receiving_team": 2,
  "player": 42
}
```

**Add Protected Pick Asset**:
```json
{
  "trade": 5,
  "asset_type": "pick",
  "giving_team": 2,
  "receiving_team": 3,
  "pick": 15,
  "pick_protection_type": "doesnt_convey",
  "pick_protection_range_start": 1,
  "pick_protection_range_end": 5,
  "pick_rollover_year": 2026
}
```

**Accept Trade Offer**:
```json
{
  "message": "Great trade, let's do it!"
}
```

**Validate Trade**:
```json
{
  "teams": [1, 2],
  "assets": [
    {
      "asset_type": "player",
      "giving_team": 1,
      "receiving_team": 2,
      "player": 42
    },
    {
      "asset_type": "pick",
      "giving_team": 2,
      "receiving_team": 1,
      "pick": 15
    }
  ]
}
```

**Response**:
```json
{
  "valid": true,
  "warnings": [],
  "errors": [],
  "team_impacts": {
    "1": {
      "net_salary": -5000000,
      "net_players": -1,
      "under_salary_cap": true,
      "under_player_cap": true,
      "new_salary": 115000000,
      "new_player_count": 12
    },
    "2": {
      "net_salary": 5000000,
      "net_players": 1,
      "under_salary_cap": true,
      "under_player_cap": true,
      "new_salary": 125000000,
      "new_player_count": 13
    }
  }
}
```

## User Workflows

### Workflow 1: Simple 2-Team Trade

1. User navigates to "Create Trade" or "Trade Center"
2. Select second team from dropdown
3. **Add Assets**:
   - From my team → their team: Player A ($10M)
   - From their team → my team: Player B ($8M)
4. Review impact: My salary goes down $2M, still under cap ✅
5. Add note: "Let's make this happen!"
6. Click "Propose Trade"
7. Other team receives notification
8. Other team reviews, clicks "Accept"
9. Trade status → "accepted"
10. Commissioner (or auto if enabled) approves
11. Trade executes: contracts updated

### Workflow 2: 3-Team Trade with Protected Pick

1. User creates trade, adds Team B and Team C
2. **Add Assets**:
   - Team A → Team B: Player X ($12M)
   - Team B → Team C: 2025 1st Round pick (top-5 protected, rolls to 2026)
   - Team C → Team A: Player Y ($10M), 2026 2nd Round pick
3. **Configure Pick Protection**:
   - Click on 2025 1st pick
   - Select "Doesn't Convey"
   - Set range: 1-5
   - Set rollover: 2026
   - Save → Badge shows "🛡️ Top-5 protected"
4. Validate: All teams under cap ✅
5. Propose trade
6. Team B and Team C receive notifications
7. Team B accepts
8. Team C rejects with message: "Not enough value"
9. Team A receives rejection notification
10. Team A creates counter-offer with modified assets

### Workflow 3: Pick Swap Protection

1. Team A has Brooklyn's 2025 1st (unprotected)
2. Team A trades for Team B's 2025 1st with swap protection
3. **Configure Swap**:
   - Add Team B's 2025 1st to trade
   - Protection type: "Swap if Best"
   - Swap target: Brooklyn's 2025 1st (owned by Team A)
4. Explanation shows: "If Team B's pick is better than Brooklyn's pick, they swap"
5. Trade executes
6. At draft time (before draft starts):
   - Brooklyn gets #3 pick
   - Team B gets #15 pick
   - Protection NOT triggered (15 > 3, so no swap)
   - Team A receives #15 pick as traded
7. Alternative scenario:
   - Brooklyn gets #15 pick
   - Team B gets #3 pick
   - Protection TRIGGERED (3 < 15, swap!)
   - Team A receives #15 pick (swapped)
   - Team B keeps #3 pick

## Technical Requirements

### Framework/Stack
- Use the existing frontend framework (React/Vue/Angular/Svelte)
- Match existing design system and component patterns
- Responsive design (mobile, tablet, desktop)
- Accessibility: WCAG 2.1 AA compliance

### State Management
- Handle complex trade state (draft, assets, validations)
- Real-time updates for trade status changes
- Optimistic UI updates with rollback on error
- Cache invalidation when trades execute

### Performance
- Lazy load trade history (pagination/infinite scroll)
- Debounce validation API calls
- Optimize asset list rendering (virtualization if needed)
- Minimize re-renders during trade composition

### Error Handling
- Network errors with retry logic
- Validation errors with specific field highlighting
- Optimistic update failures with user notification
- Concurrent modification handling (trade changed while viewing)

### Testing
- Unit tests for validation logic
- Integration tests for trade workflows
- E2E tests for critical paths (create, propose, accept, execute)
- Visual regression tests for complex components

## Design Considerations

### UX Principles
- **Clarity**: Every asset, protection, and impact must be crystal clear
- **Confidence**: Users must understand exactly what they're agreeing to
- **Reversibility**: Draft trades can be edited; proposed trades can be withdrawn
- **Feedback**: Immediate validation feedback, no surprises
- **Guidance**: Tooltips, help text, examples for complex concepts

### Visual Hierarchy
- **Primary**: Trade status, my response actions
- **Secondary**: Asset lists, impact analysis
- **Tertiary**: Notes, timestamps, history

### Color Coding
- **Green**: Under cap, beneficial changes, accepted
- **Red**: Over cap, violations, rejected
- **Yellow**: Warnings, pending responses
- **Blue**: Info, neutral changes
- **Gray**: Completed, historical

### Mobile Optimization
- Simplified trade creation flow (step-by-step wizard)
- Collapsible sections for asset lists
- Sticky action buttons
- Swipe gestures for accept/reject
- Bottom sheet modals instead of centered

## Edge Cases to Handle

1. **Trade Cancelled While Reviewing**
   - Show message: "This trade has been cancelled by the proposer"
   - Disable all actions

2. **Counter-Offer Chain**
   - Display counter-offer history/thread
   - Clearly mark which trade is active
   - Link to original trade

3. **Commissioner Override**
   - Show override reason/notes
   - Display commissioner who took action
   - Indicate in trade history

4. **Pick Already Traded**
   - Prevent selection in trade composer
   - Show "Already traded to [Team]" tooltip
   - Display trade history on pick

5. **RFA Player Not Owned**
   - Show error: "You don't own the rights to this RFA"
   - Explain RFA trading rules

6. **Protection Becomes Invalid**
   - Swap target pick gets traded
   - Rollover year pick already exists
   - Show error and require reconfiguration

7. **All Teams Accept but Trade Fails Execution**
   - Rare: cap situation changed between acceptance and execution
   - Show error message
   - Revert trade to "accepted" status
   - Notify all teams

## Success Metrics

- Trade creation completion rate
- Time to complete trade (creation → execution)
- Trade rejection rate with reasons
- User errors during trade composition
- Mobile vs desktop usage patterns
- Commissioner approval time

## Deliverables

1. **Components**:
   - TradeComposer/Builder
   - TradeInbox/Dashboard
   - TradeReview/DetailView
   - PickProtectionConfig
   - TradeFlowDiagram
   - ValidationFeedback components

2. **Pages/Routes**:
   - `/trades` - Trade inbox
   - `/trades/new` - Create trade
   - `/trades/:id` - Trade details
   - `/trades/:id/counter` - Counter-offer

3. **API Integration**:
   - Service/API layer for all trade endpoints
   - TypeScript types/interfaces for all models
   - Error handling and loading states

4. **Tests**:
   - Component unit tests
   - Integration tests
   - E2E critical path tests

5. **Documentation**:
   - User guide for creating trades
   - User guide for pick protections
   - Developer documentation for components

## Additional Context

**League Settings** (from backend):
```python
LEAGUE_SETTINGS = {
    "SALARY_CAP": 140000000,      # $140M
    "MIN_PLAYER_CAP": 8,          # Minimum 8 players
    "MAX_PLAYER_CAP": 15,         # Maximum 15 players
}
```

**Contract Model** (relevant for RFA logic):
```python
class Contract:
    player: Player
    team: Team
    start_year: int
    duration: int              # 1-4 years
    salary: Decimal
    is_rfa: bool              # Restricted Free Agent
    is_to: bool               # Team Option
```

**Current Year** (for contract year calculations):
- Use `new Date().getFullYear()` or fetch from API
- Years remaining = (start_year + duration) - current_year
- RFA tradeable if: years_remaining <= 0 AND is_rfa = true

## Questions to Clarify with Backend Team

1. Are there rate limits on validation API calls?
2. Is there a WebSocket/SSE endpoint for real-time trade updates?
3. Should draft trades auto-save, or require explicit "Save Draft"?
4. What's the commissioner approval workflow? Auto-approved if no commissioner?
5. Are there any league-specific rules beyond salary/player caps?
6. Can trades be scheduled for future execution?
7. Is there a trade deadline feature?
8. Can picks from future years (e.g., 2027) be traded now?

## Starting Point Recommendations

1. **Phase 1** (MVP):
   - Simple 2-team trades
   - Player-only assets (no picks yet)
   - Basic validation (cap compliance)
   - Accept/reject workflow

2. **Phase 2**:
   - Pick trading (unprotected picks)
   - Multi-team trades (3+ teams)
   - Counter-offers
   - Trade history

3. **Phase 3**:
   - Pick protections (all types)
   - Advanced validation
   - Trade analytics/fairness indicators
   - Commissioner tools

4. **Phase 4**:
   - Mobile optimization
   - Real-time updates
   - Advanced UX features (drag-drop, quick actions)
   - Performance optimizations

Good luck! This is a complex feature with lots of edge cases, but with careful attention to validation, clear UX, and thorough testing, you'll create a robust trading system.
