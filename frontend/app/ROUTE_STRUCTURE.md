# App Route Structure

## Next.js App Router Files

### Root Layout
**File**: `app/layout.tsx`  
**Purpose**: Root layout with providers

**Structure**:
```typescript
// TODO: Implement JSX
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

### Landing Page
**File**: `app/page.tsx`  
**Route**: `/`  
**Purpose**: Entry point - start learning session

**Structure**:
```typescript
// TODO: Implement JSX
export default function LandingPage() {
  // Create session on button click
  // Redirect to /lessons/[sessionId]/screen_001
}
```

---

### Lesson Screen Page
**File**: `app/lessons/[sessionId]/[screenId]/page.tsx`  
**Route**: `/lessons/[sessionId]/[screenId]`  
**Purpose**: Main learning interface

**Structure**:
```typescript
// TODO: Implement JSX
interface PageProps {
  params: {
    sessionId: string;
    screenId: string;
  };
}

export default function LessonScreenPage({ params }: PageProps) {
  // Load screen data
  // Render GuidedPractice component
  // Handle navigation
}
```

---

## Route Parameters

### `[sessionId]`
- **Type**: `string`
- **Source**: Created on landing page
- **Usage**: Identifies learning session

### `[screenId]`
- **Type**: `string`
- **Source**: Determined by lesson flow
- **Usage**: Identifies current lesson screen

---

## Navigation Flow

```
/ → Create Session → /lessons/[sessionId]/screen_001
  → Complete Screen → /lessons/[sessionId]/screen_002
  → Complete Screen → /lessons/[sessionId]/screen_003
  → Session Complete
```

---

## File Structure

```
app/
├── layout.tsx                    # Root layout (TODO: JSX)
├── page.tsx                      # Landing page (TODO: JSX)
└── lessons/
    └── [sessionId]/
        └── [screenId]/
            └── page.tsx          # Lesson screen (TODO: JSX)
```
