# SaaSGuide UI Component Library

This UI component library is built with shadcn/ui, Tailwind CSS, and Radix UI primitives to provide a consistent design system for the SaaSGuide application.

## Components

### Layout Components
- `Card`: Container for grouping related content with header, content, and footer sections
- `Separator`: Horizontal or vertical divider line

### Form Components
- `Button`: Interactive button with various styles and sizes
- `Input`: Text input field for forms
- `Checkbox`: Selection control for forms
- `Switch`: Toggle switch for binary options
- `Toggle`: Button that can be toggled on/off

### Data Display Components
- `Avatar`: User profile picture with fallback
- `Badge`: Status indicators and labels
- `DropdownMenu`: Menu that appears when triggered by a button

## Theme System

The theme system supports light and dark modes using CSS variables and the `next-themes` library. The theme can be toggled using the `ModeToggle` component.

### Usage

```tsx
// Import the component
import { Button } from "@/components/ui/button";

// Use it in your component
export default function MyComponent() {
  return (
    <Button variant="default" size="default">
      Click Me
    </Button>
  );
}
```

## Variants and Customization

Most components support variants and sizes through the `class-variance-authority` library. For example, the Button component supports:

### Variants
- `default`: Primary action
- `destructive`: Dangerous action
- `outline`: Secondary action with border
- `secondary`: Alternative styling
- `ghost`: Minimal styling
- `link`: Appears as a hyperlink

### Sizes
- `default`: Standard size
- `sm`: Small size
- `lg`: Large size
- `icon`: Square button for icons

## Utilities

- `cn()`: Utility function for merging class names with Tailwind classes

## Responsive Design

All components are built with responsive design in mind and work well on all screen sizes.

