# SaaSGuide UI Component Library

This UI component library is built with shadcn/ui, Tailwind CSS, and Radix UI primitives to provide a consistent design system for the SaaSGuide application.

## Components

### Layout Components
- `Card`: Container for grouping related content with header, content, and footer sections
- `Separator`: Horizontal or vertical divider line
- `Tabs`: Tabbed interface for organizing content

### Form Components
- `Button`: Interactive button with various styles and sizes
- `Input`: Text input field for forms
- `Checkbox`: Selection control for forms
- `Switch`: Toggle switch for binary options
- `Toggle`: Button that can be toggled on/off
- `Select`: Dropdown selection control
- `Label`: Text label for form controls
- `Form`: Form components with validation support

### Data Display Components
- `Avatar`: User profile picture with fallback
- `Badge`: Status indicators and labels
- `DropdownMenu`: Menu that appears when triggered by a button
- `Dialog`: Modal dialog for important actions
- `Tooltip`: Contextual information on hover

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

## Form Validation

The Form components integrate with `react-hook-form` and `zod` for form validation:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(2).max(50),
});

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Utilities

- `cn()`: Utility function for merging class names with Tailwind classes

## Responsive Design

All components are built with responsive design in mind and work well on all screen sizes.
