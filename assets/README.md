# Assets Directory

This directory contains all static assets for the NisapotiV1 project.

## Structure

```
assets/
├── images/
│   ├── icons/          # Small icons and UI elements
│   ├── logos/          # Brand logos and company logos
│   ├── illustrations/  # Custom illustrations and graphics
│   ├── photos/         # Photography and real images
│   └── backgrounds/    # Background images and patterns
└── README.md          # This file
```

## Usage Guidelines

### Image Organization
- **icons/**: Store small icons (typically 16x16 to 64x64 pixels)
- **logos/**: Store brand logos and company logos
- **illustrations/**: Store custom graphics, diagrams, and illustrations
- **photos/**: Store photography and real-world images
- **backgrounds/**: Store background images, patterns, and textures

### Naming Conventions
- Use kebab-case for file names (e.g., `hero-background.jpg`)
- Include descriptive names that indicate the image's purpose
- For multiple versions, use suffixes like `-small`, `-large`, `-dark`, `-light`

### File Formats
- **PNG**: For images with transparency or simple graphics
- **JPG/JPEG**: For photographs and complex images
- **SVG**: For scalable vector graphics and icons
- **WebP**: For optimized web images (when supported)

### Importing in Next.js
```tsx
import Image from 'next/image'
import logo from '@/assets/images/logos/logo.png'

// Usage
<Image src={logo} alt="Logo" width={200} height={100} />
```

## Current Assets
- `draft.png` → `images/illustrations/draft.png`
- `logo.png` → `images/logos/logo.png`
