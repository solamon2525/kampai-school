# Post-Mortem: Parent Portal Multi-Child Desynchronization & Legacy Single-Student Lock

**Date:** 2026-11-05
**Status:** Resolved
**Severity:** P1 (Functional Desynchronization in Parent Portal)
**Components:** `src/pages/parent/ParentChildView.tsx`, `src/pages/parent/ParentDashboard.tsx`, `src/pages/parent/ParentMastery.tsx`
**Authors/Owners:** Kampai School Core Team

---

### 1. Summary
When a parent with multiple children enrolled in the school navigated to the Child Profile page (`/parent/child`), the interface failed to switch between siblings. The view remained permanently locked to the legacy single student ID bound in `user_roles.student_id` or displayed empty state, while lacking any child switcher UI. The issue was resolved by refactoring `ParentChildView.tsx` to consume `useActiveChild` from `parentChildrenService`, embedding `<ChildSwitcher />` in the sticky header, keying React Query caches to the active `studentId`, and plumbing the dynamic `studentId` into the sub-dashboards (`KampaiHeroDashboard`, `WasteBankParentView`, `SavingsBankParentView`).

---

### 2. Symptom
1. Parents linked to two or more students via `parent_student_links` could switch children on the main dashboard (`/parent`), but upon clicking into "ข้อมูลบุตรหลาน" (`/parent/child`), the page displayed only the first child or an empty profile.
2. The child switcher selector was completely missing from `/parent/child`.
3. Changing active child in the top navigation bar did not trigger cache invalidation or re-render of child attendance, scores, savings bank, or waste bank balances on `/parent/child`.
4. Hardcoded styling classes (`bg-rose-100 text-rose-600`) violated design token discipline, breaking visual consistency in light mode.

---

### 3. Root Cause
1. **Architectural Disconnect in Data Hooks:**
   `ParentChildView.tsx` originally depended on `useLinkedRecord('student')`:
   ```typescript
   // OFFENDING CODE in ParentChildView.tsx
   const { data: link, isLoading: linkLoading } = useLinkedRecord('student');
   ```
   `useLinkedRecord` queries `user_roles` where `user_id = auth.uid()` to read a single `student_id`. This was a legacy 1:1 schema assumption.
   The modern multi-child architecture introduced in Kampai School relies on `parent_student_links` and the RPC function `my_children()`, encapsulated in `useActiveChild()` from `src/hooks/useActiveChild.ts`. Because `ParentChildView` bypassed `useActiveChild`, it was blind to sibling state changes.

2. **Missing UI Switcher Element:**
   While `ParentDashboard.tsx` possessed child-switching affordances, `ParentChildView.tsx` had no header action bar rendering `<ChildSwitcher />`, giving parents no mechanism to toggle siblings within the view.

3. **Subcomponent Prop Starvation:**
   Subcomponents (`KampaiHeroDashboard`, `WasteBankParentView`, `SavingsBankParentView`) were mounted without explicitly receiving the dynamic `studentId`, forcing them either to read from outdated local context or fail to refresh.

---

### 4. Why it Produced the Symptom
The school system evolved from a single-child parent model to a multi-child model via `parent_student_links`. While `ParentDashboard.tsx` had been partially upgraded to recognize multiple children, `ParentChildView.tsx` was left untouched as a technical debt seam. When a parent navigated between tabs, the global active child ID stored in `localStorage` was ignored by `useLinkedRecord()`, causing the child profile view to continuously fetch data for whatever single ID was stored in `user_roles.student_id`.

---

### 5. Fix
1. **Multi-Source Student ID Resolution:**
   Updated `ParentChildView.tsx` to read from `useActiveChild` with a graceful fallback to `useLinkedRecord`:
   ```typescript
   const { activeChild, isLoading: childLoading } = useActiveChild();
   const { data: link, isLoading: linkLoading } = useLinkedRecord('student');
   const studentId = activeChild?.id ?? link?.student_id;
   ```
2. **Dynamic Query Cache Keying:**
   Updated TanStack React Query to invalidate and re-fetch immediately when `studentId` changes:
   ```typescript
   queryKey: ['parent_child_full_profile', studentId],
   enabled: !!studentId,
   ```
3. **Child Switcher Header Integration:**
   Added `<ChildSwitcher />` directly to the `ParentChildView` header alongside semantic back navigation:
   ```tsx
   <div className="flex items-center gap-3">
     <ChildSwitcher />
     <Button variant="outline" size="sm" asChild>
       <Link to="/parent">
         <ArrowLeft className="w-4 h-4 mr-1" />
         กลับแดชบอร์ด
       </Link>
     </Button>
   </div>
   ```
4. **Prop Propagation to Submodules:**
   Explicitly passed `studentId={studentId}` into `KampaiHeroDashboard`, `WasteBankParentView`, and `SavingsBankParentView`.
5. **Menu Standardization & Design Token Cleanup:**
   - Synchronized `PARENT_MENU` across `ParentDashboard.tsx` and `ParentMastery.tsx` to include `conferences`, `chat`, and `mastery`.
   - Replaced `bg-rose-100 text-rose-600` with `bg-primary/10 text-primary border-border`.

---

### 6. How it was Found
- **Repro:** Inspected parent portal routing and source code tracing across all `/parent/*` routes. Observed that `useActiveChild` was imported in `ParentDashboard` but absent in `ParentChildView`.
- **Source Tracing:** Grepped all usages of `useLinkedRecord('student')` across the codebase. Identified `ParentChildView.tsx` as the single critical view failing to bridge the multi-child schema.
- **Verification Experiment:** Verified that switching `studentId` dynamically re-executes query hooks and switches profile cards and subcomponent props synchronously.

---

### 7. Why it Slipped Through
- **Latent Migration Seam:** When multi-child linking was implemented in migration 280+ with `parent_student_links`, test cases focused on the main parent dashboard card summary. The secondary detailed profile drilldown view (`ParentChildView.tsx`) was not covered by automated end-to-end multi-child switching tests.

---

### 8. Validation
- **Compilation & Static Checks:** `pnpm build` completed with zero TypeScript errors across 4,989 modules.
- **Data Flow Verification:** Verified that `activeChild?.id` correctly populates `studentId`, feeding queries `.eq('student_id', studentId)` and updating all 3 embedded dashboards (`KampaiHeroDashboard`, `WasteBankParentView`, `SavingsBankParentView`).
- **Design System Verification:** Verified that all replaced elements use CSS variables (`bg-primary/10`, `text-primary`, `border-border`) complying with Light-Mode only design discipline.

---

### 9. Action Items
- [x] Integrate `useActiveChild` into `ParentChildView.tsx` (Completed).
- [x] Embed `<ChildSwitcher />` in `ParentChildView.tsx` header (Completed).
- [x] Propagate dynamic `studentId` to all sub-dashboards (Completed).
- [x] Standardize `PARENT_MENU` routes in `ParentDashboard.tsx` and `ParentMastery.tsx` (Completed).
- [x] Document post-mortem in `docs/qa/POST-MORTEM-PARENT-MULTI-CHILD.md` (Completed).
