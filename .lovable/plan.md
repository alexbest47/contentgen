

## Plan: Hide Unselected Lead Magnets & Rename Project

### Changes

**File: `src/pages/ProjectDetail.tsx`**

1. **Hide unselected lead magnets after selection**: Filter `leadMagnets` to show only the selected one when `project.status === "lead_selected"` or `"completed"`. When status is `"leads_ready"`, show all three as before.

2. **Update project title to lead magnet title on selection**: In `selectMutation.mutationFn`, after updating the project's `selected_lead_magnet_id` and `status`, also update the project's `title` to the selected lead magnet's `title`. This requires finding the lead magnet object from the `leadMagnets` array by ID.

### Implementation Detail

```tsx
// In selectMutation.mutationFn, add title update:
const selectedLm = leadMagnets?.find(lm => lm.id === leadMagnetId);
const { error } = await supabase.from("projects").update({
  selected_lead_magnet_id: leadMagnetId,
  status: "lead_selected",
  title: selectedLm?.title ?? project?.title,  // rename project
}).eq("id", projectId!);

// In the render, filter lead magnets:
const visibleLeadMagnets = (project?.status === "lead_selected" || project?.status === "completed")
  ? leadMagnets?.filter(lm => lm.is_selected)
  : leadMagnets;
```

Then use `visibleLeadMagnets` instead of `leadMagnets` in the grid rendering.

