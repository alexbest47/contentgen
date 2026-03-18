

## Problem

The JSON import function checks for `item.children` to find subtopics, but the imported JSON file likely uses a different key name (e.g., `subtopics`, `topics`, `sub_topics`, `items`). As a result, the recursive import only processes root-level topics and ignores all 297 subtopics.

## Fix

In `src/pages/TopicTree.tsx`, normalize each JSON item's children key before recursion. Add a helper that checks common alternative keys and maps them to `children`:

```typescript
const getChildren = (item: any): any[] => {
  return item.children || item.subtopics || item.topics || item.sub_topics || item.items || [];
};
```

Replace `item.children?.length` and `item.children` references in `insertRecursive` with `getChildren(item)`.

Also optimize: currently 329 sequential HTTP requests is slow. Switch to batch inserts -- insert all items at one level at once, then recurse for each parent's children.

### Changes in `src/pages/TopicTree.tsx`

1. Add `getChildren` helper function
2. Update `insertRecursive` to use `getChildren(item)` instead of `item.children`
3. Add batch insert optimization: insert multiple siblings in one request, then query returned IDs

### File
- `src/pages/TopicTree.tsx` -- lines 236-256 (the `insertRecursive` function)

