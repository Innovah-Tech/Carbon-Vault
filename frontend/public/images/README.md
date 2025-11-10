# Images Directory

This directory contains all images used in the CarbonVault frontend application.

## Structure

```
images/
├── logos/          # Brand logos and icons
├── icons/          # UI icons and graphics
└── placeholders/   # Placeholder images
```

## Usage

### Logos
- `logos/carbonvault-logo.png` - Main CarbonVault logo
- `logos/carbonvault-icon.svg` - Favicon and small icon

### Icons
- `icons/carbon-credit.svg` - Carbon credit icon
- `icons/zk-proof.svg` - ZK proof icon
- `icons/staking.svg` - Staking icon

### Placeholders
- `placeholders/avatar.png` - Default user avatar
- `placeholders/listing.png` - Default listing image

## Image Optimization

All images should be optimized before use:
- Use WebP format when possible
- Compress images to reduce file size
- Use appropriate dimensions (max 1920px width)
- Provide dark mode variants when needed

## Adding New Images

1. Add image to appropriate subdirectory
2. Update this README with image description
3. Use Next.js Image component for optimization:
   ```tsx
   import Image from 'next/image'
   
   <Image
     src="/images/logos/carbonvault-logo.png"
     alt="CarbonVault Logo"
     width={200}
     height={50}
   />
   ```

