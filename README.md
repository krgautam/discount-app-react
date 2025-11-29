# Shopify Discount Functions React Router App

> [!NOTE]
> Instead of cloning this repo, you can use the Shopify CLI to create a new app using the following command:
>
> ```bash
> shopify app init --template https://github.com/Shopify/discounts-reference-app/examples/remix-app
> ```

This app demonstrates the discount Functions API, which allows merchants to combine multiple discount types (product, order, and shipping) in a single function. It serves as a reference implementation.

## Volume Discount Banner Theme Extension

This app includes a theme extension that displays a banner on product pages when products are configured in volume discount rules. The banner shows "Buy {minQty} products and get {percentOff}% OFF" for eligible products.

## Overview

The discount Function API allows you to create complex discounts by allowing a single automatic discount or discount code to produce discount candidates of multiple classes. This eliminates the need to configure multiple separate Functions for different discount types.

### Key Features

- **Multi-class Discounts**
  - Combine product, order, and shipping discounts in one Function
  - Target specific product collections
  - Apply percentage-based discounts

- **Flexible Configuration**
  - Create automatic discounts or discount codes
  - Set usage limits
  - Configure combination rules with other discounts

- **Developer Experience**
  - Built with TypeScript and React Router
  - Uses Shopify's Polaris design system
  - Shopify GraphQL AdminAPI integration

## Prerequisites

1. Node.js 18.x or later
2. [Shopify Partner account](https://partners.shopify.com/signup)
3. Development store or [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store)
4. [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed
5. Add a Mongodb DATABASE Url as MONGODB_URI in .env file
## Discount Function

To setup your discount function, you can use the Shopify CLI to create a new function.

```bash
shopify app generate extension --template discount
```

Then follow the instructions found in the [Build a discount UI with Remix](https://shopify-dev.shop.dev/docs/apps/build/discounts/build-ui-with-remix?extension=rust#update-the-discount-function-extension-to-read-metafield-data) tutorial.

## Development

### Install & Dev Commands

```bash
# Install dependencies
npm install
# or
pnpm install

# Set up the database
npm run setup
# or
pnpm run setup

# Start the development server
npm run dev
# or
pnpm run dev

# Build the app
npm run build
# or
pnpm run build

# Deploy the app
npm run deploy
# or
pnpm run deploy
```

### Running the App

```bash
# Start the development server (includes theme extension)
npm run dev
```

The development server will:
- Start the app backend
- Serve the theme extension
- Enable hot reloading for both app and theme code

## Deployment

1. Build the app:

```bash
pnpm run build
```

2. Deploy to your preferred hosting platform ([deployment guide](https://shopify.dev/docs/apps/deployment/web))

3. Set required environment variables:

```bash
NODE_ENV=production
```

## Troubleshooting

### Missing Database Tables

If you encounter the error `The table 'main.Session' does not exist`:

```bash
pnpm run setup
```

### OAuth Loop Issues

If authentication loops when changing scopes:

```bash
# Update app scopes
pnpm run deploy

# Or reset during development
pnpm run dev --reset
```

## Configuration Storage

### Metafield Namespace & Key

The app stores discount configuration in metafields:

**Discount Metafields** (on discount objects):
- **Namespace**: `volume_discount`
- **Key**: `rules`
- **Type**: `json`
- **Structure**:
  ```json
  {
    "products": ["gid://shopify/Product/123", "gid://shopify/Product/456"],
    "minQty": 2,
    "percentOff": 10
  }
  ```

**Shop Metafield** (for theme access):
- **Namespace**: `volume_discount`
- **Key**: `rules`
- **Type**: `json`
- **Structure**: Array of discount rules
  ```json
  [
    {
      "products": ["gid://shopify/Product/123"],
      "minQty": 2,
      "percentOff": 10
    }
  ]
  ```

The shop metafield is automatically synced when discounts are created or updated. You can also manually trigger a sync from the app's main page (`/app`) using the "Sync Now" button.

## Adding the Theme Block

### How to Add the Volume Discount Banner in Theme Editor

1. **Open Theme Editor**:
   - Go to Shopify Admin → Online Store → Themes
   - Click "Customize" on your active theme

2. **Navigate to Product Page**:
   - In the theme editor, select "Product pages" from the left sidebar

3. **Add the Block**:
   - Click "Add block" or the "+" button in the product page template
   - Search for "Volume Discount Banner" in the block list
   - Click to add it to your product page

4. **Position the Block**:
   - Drag the block to your desired location (typically above or below the product title/price)
   - The banner will automatically show for products configured in active discount rules

5. **Save**:
   - Click "Save" in the top right corner

### Block Behavior

- The banner automatically appears when:
  - The current product is included in an active discount rule
  - The discount is currently active (within start/end dates)
  - The product page is being viewed

- The banner displays:
  - Minimum quantity required: `{minQty}`
  - Discount percentage: `{percentOff}%`
  - Message: "Buy {minQty} products and get {percentOff}% OFF"

## Limitations & Next Steps

### Current Limitations

1. **Manual Sync Required**: 
   - The shop metafield must be synced after creating/updating discounts
   - Sync happens automatically on create/update, but can be manually triggered from `/app`

2. **Active Discounts Only**:
   - Only active discounts (within date range) are synced to the shop metafield
   - Expired or future discounts won't show banners

3. **Single Rule Display**:
   - If a product appears in multiple discount rules, only the first matching rule's banner is displayed

4. **Theme Compatibility**:
   - The block uses standard Liquid syntax and should work with most themes
   - Custom styling may be needed to match your theme's design

5. **Metafield Access**:
   - Requires the shop metafield to exist and be accessible
   - If the banner doesn't show, check that the metafield exists in Shopify Admin → Settings → Custom data → Shop

### Next Steps / Future Improvements

1. **Automatic Sync on Discount Changes**:
   - Implement webhooks to automatically sync when discounts are modified externally

2. **Multiple Rules Support**:
   - Display banners for all applicable discount rules, not just the first match

3. **Customizable Banner Design**:
   - Add theme editor settings for colors, fonts, and styling

4. **Collection-Level Discounts**:
   - Extend support for collection-based discount rules

5. **Cart Integration**:
   - Show progress indicator (e.g., "Add 1 more product to get 10% OFF")

6. **Performance Optimization**:
   - Cache metafield data to reduce Liquid processing time

7. **Error Handling**:
   - Better fallback behavior when metafield is missing or malformed

## Tech Stack

- [React Router](https://reactrouter.com/) - Web framework
- [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge) - Admin integration
- [Polaris](https://polaris.shopify.com/) - Design system
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Prisma](https://www.prisma.io/) - Database ORM
- [Shopify Liquid](https://shopify.dev/docs/api/liquid) - Theme extension language
