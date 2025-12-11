# Terra Trionfo - Project Overview

## 🎯 Project Summary

Terra Trionfo is a **production-ready farm-to-table marketplace** built for Trionfo Holding Co., Inc. The platform enables artisan producers to sell through two distinct business models:

1. **Marketplace Model**: Vendors list products and set prices (Terra Trionfo takes commission)
2. **Wholesale Model**: Terra Trionfo purchases inventory and manages retail pricing

A single vendor can use both models for different products, providing maximum flexibility.

---

## ✅ What's Included

### Core Features ✓
- ✅ Full authentication system (email/password)
- ✅ Three user roles: Admin, Vendor, Consumer
- ✅ Company registration and approval workflow
- ✅ Product creation with dual model support
- ✅ Shopping cart and checkout (mock payment)
- ✅ Order history and tracking
- ✅ Admin dashboard with analytics
- ✅ Vendor portal for product management
- ✅ Responsive design (mobile-friendly)
- ✅ Vintage Italian farmhouse branding

### Technical Implementation ✓
- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ PostgreSQL database with Prisma ORM
- ✅ NextAuth for authentication
- ✅ Tailwind CSS with custom theme
- ✅ Role-based access control
- ✅ API routes for all CRUD operations
- ✅ Database seeding with sample data
- ✅ Comprehensive README and documentation

---

## 📋 File Structure Overview

```
Terra-Trionfo/
│
├── 📱 Frontend Pages
│   ├── app/page.tsx                    # Landing page with hero
│   ├── app/products/page.tsx           # Product catalog
│   ├── app/products/[id]/page.tsx      # Product detail
│   ├── app/cart/page.tsx               # Shopping cart
│   ├── app/auth/signin/page.tsx        # Sign in
│   ├── app/auth/signup/page.tsx        # Registration
│   ├── app/dashboard/admin/page.tsx    # Admin dashboard
│   ├── app/dashboard/vendor/page.tsx   # Vendor dashboard
│   └── app/account/orders/page.tsx     # Order history
│
├── 🔌 API Routes
│   ├── app/api/auth/                   # NextAuth endpoints
│   ├── app/api/users/route.ts          # User management
│   ├── app/api/companies/              # Company CRUD
│   ├── app/api/products/               # Product CRUD
│   ├── app/api/orders/route.ts         # Order processing
│   └── app/api/admin/stats/route.ts    # Admin analytics
│
├── 🎨 Components
│   ├── components/layout/Header.tsx    # Navigation header
│   ├── components/layout/Footer.tsx    # Site footer
│   ├── components/products/ProductCard.tsx
│   └── components/providers/AuthProvider.tsx
│
├── 🗃️ Database
│   ├── prisma/schema.prisma            # Database schema
│   ├── prisma/seed.ts                  # Sample data
│   └── lib/prisma.ts                   # Prisma client
│
├── ⚙️ Configuration
│   ├── package.json                    # Dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── tailwind.config.ts              # Custom colors/fonts
│   ├── next.config.js                  # Next.js config
│   ├── .env                            # Environment variables
│   └── lib/auth.ts                     # NextAuth config
│
└── 📚 Documentation
    ├── README.md                       # Full documentation
    ├── QUICKSTART.md                   # Quick setup guide
    └── setup.sh                        # Automated setup script
```

---

## 🎨 Design System

### Color Palette
```css
/* Parchment (backgrounds) */
--parchment-50: #fdfcfb
--parchment-100: #faf8f5
--parchment-200: #f5f0e8
--parchment-300: #ede5d6
--parchment-400: #e3d7c1
--parchment-500: #d6c7aa

/* Olive (accents) */
--olive-50: #f7f8f5
--olive-600: #556542
--olive-700: #445037
--olive-800: #38412e
--olive-900: #2f3728
```

### Typography
- **Display**: Playfair Display (serif) - for headings and logo
- **Body**: Inter (sans-serif) - for readable content

### Visual Style
- Rounded cards with subtle shadows
- Thin olive-colored borders
- Paper/linen texture feel
- Warm, trustworthy, artisanal aesthetic

---

## 🔑 Key Workflows

### Admin Workflow
```
1. Sign in as Admin
2. Dashboard → View pending companies/products
3. Review company details
4. Approve or reject company
5. Review product submissions
6. Approve or reject products
7. Override pricing if needed
8. Monitor orders and revenue
```

### Vendor Workflow
```
1. Sign up as Vendor
2. Register company profile
3. Wait for admin approval
4. Once approved, create products
5. For each product:
   - Choose Marketplace or Wholesale
   - Set pricing based on model
   - Add inventory
6. Submit for approval
7. Track product status
8. View sales analytics
```

### Consumer Workflow
```
1. Browse products (no login needed)
2. Sign in or register
3. Add products to cart
4. Review cart
5. Proceed to checkout (mock)
6. Order confirmed
7. View order history
```

---

## 🗄️ Database Schema

### User
- id, email, passwordHash, name, role
- Roles: ADMIN, VENDOR, CONSUMER

### Company
- id, name, contactEmail, phone, address, description
- status: PENDING, APPROVED, REJECTED
- ownerId → User

### Product
- id, name, description, category, imageUrl
- isMarketplace, isWholesale (boolean flags)
- basePrice, wholesaleCost, consumerPrice
- inventory, status
- companyId → Company

### Order
- id, userId, total, status, createdAt

### OrderItem
- id, orderId, productId, quantity, unitPrice
- modelType: MARKETPLACE or WHOLESALE

### Settings
- defaultMarketplaceMarkupPercent

---

## 💰 Pricing Logic

### Marketplace Product
```typescript
if (product.isMarketplace) {
  basePrice = 20.00  // Set by vendor
  markup = 20%       // From Settings
  consumerPrice = basePrice * 1.20 = 24.00
  // Admin can override consumerPrice
}
```

### Wholesale Product
```typescript
if (product.isWholesale) {
  wholesaleCost = 10.00   // What Terra pays vendor
  consumerPrice = 30.00   // Set by Terra/Admin
  margin = 20.00          // Terra's profit
}
```

### Hybrid Product
```typescript
if (product.isMarketplace && product.isWholesale) {
  // Both models available
  // Different pricing for each
  // Flexible choice per transaction
}
```

---

## 🔐 Security Features

1. **Password Security**
   - bcryptjs hashing (10 rounds)
   - No plain text passwords

2. **Authentication**
   - JWT-based sessions
   - httpOnly cookies
   - Secure session management

3. **Authorization**
   - Role-based access control
   - API route protection
   - Frontend route guards

4. **Data Protection**
   - Prisma ORM (prevents SQL injection)
   - Input validation
   - XSS protection via React

---

## 📊 Sample Data (Seeded)

### Users
- 1 Admin: admin@terratrionfo.com
- 1 Vendor: vendor@example.com
- 1 Consumer: consumer@example.com
- All passwords: password123

### Company
- Famiglia Rossi Farms (APPROVED)
- Italian family farm with organic products

### Products (6 items)
1. Extra Virgin Olive Oil (Marketplace)
2. Chianti Classico DOCG 2020 (Wholesale)
3. Artisan Pasta Variety Pack (Both)
4. Aged Balsamic Vinegar (Marketplace)
5. San Marzano Tomatoes (Wholesale)
6. Truffle-Infused Honey (Pending)

### Orders
- 1 sample order with 3 items
- Shows mix of marketplace and wholesale

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure database
cp .env.example .env
# Edit .env with your database URL

# 3. Set up database
npm run prisma:migrate

# 4. Seed sample data
npm run prisma:seed

# 5. Start development server
npm run dev
```

Visit http://localhost:3000

---

## 🧪 Testing

### Manual Testing Checklist

**As Admin:**
- [ ] Sign in successfully
- [ ] View dashboard statistics
- [ ] Approve a pending company
- [ ] Approve a pending product
- [ ] Reject a product
- [ ] View orders list

**As Vendor:**
- [ ] Register new company
- [ ] Create marketplace product
- [ ] Create wholesale product
- [ ] View product status
- [ ] Edit company profile

**As Consumer:**
- [ ] Browse products
- [ ] Filter by category
- [ ] View product details
- [ ] Add to cart
- [ ] Complete checkout
- [ ] View order history

---

## 📈 Future Enhancements

### Phase 2 Features
- [ ] Real payment processing (Stripe)
- [ ] Email notifications (SendGrid)
- [ ] Product reviews and ratings
- [ ] Advanced search and filters
- [ ] Vendor analytics dashboard
- [ ] Inventory low-stock alerts

### Phase 3 Features
- [ ] Multi-currency support
- [ ] Shipping integrations
- [ ] Subscription products
- [ ] Affiliate program
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations

---

## 🎯 Business Metrics

### Admin Dashboard Shows:
- Total active vendors
- Total approved products
- Total orders placed
- Gross revenue
- Pending approvals (companies & products)
- Recent orders list

### Vendor Can Track:
- Company approval status
- Product approval statuses
- Units sold per product
- Revenue per product
- Total inventory

---

## 🛠️ Maintenance

### Regular Tasks
- Monitor error logs
- Review and approve submissions
- Update product images
- Manage inventory levels
- Process refunds/returns
- Update pricing strategies

### Database Maintenance
```bash
# Backup database
pg_dump terra_trionfo > backup.sql

# View data in GUI
npm run prisma:studio

# Reset database (dev only)
npx prisma migrate reset
```

---

## 📞 Support & Contact

**Trionfo Holding Co., Inc.**
- Website: terratrionfo.com
- Email: info@terratrionfo.com
- Support: support@terratrionfo.com

---

## 📄 License

Copyright © 2024 Trionfo Holding Co., Inc.
All rights reserved.

---

**Terra Trionfo** - *Born of the Land* 🌾

*Connecting artisan producers with discerning consumers since 2024*
