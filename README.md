# Terra Trionfo

**Born of the Land** - A premium farm-to-table marketplace and wholesale distribution platform

Terra Trionfo connects artisan producers with discerning consumers through dual business models: marketplace listings (where vendors set their own prices) and wholesale distribution (where Terra Trionfo purchases inventory and manages pricing/distribution).

![Terra Trionfo](https://img.shields.io/badge/Built%20with-Next.js-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

## 🌾 Features

### **Multi-Role Architecture**
- **Admin Dashboard**: Approve vendors and products, manage pricing, view analytics
- **Vendor Portal**: Register company, list products, choose business models per product
- **Consumer Shop**: Browse products, add to cart, place orders

### **Dual Business Models**
- **Marketplace**: Vendors list products and set base prices
- **Wholesale**: Terra Trionfo purchases inventory and manages retail pricing
- **Hybrid**: Single vendors can use both models for different products

### **Brand & Design**
- Vintage Italian farmhouse aesthetic with warm parchment backgrounds
- Deep olive green accents and classic serif typography
- Responsive design with Tailwind CSS
- Professional, trustworthy, artisanal feel

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom color palette
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- PostgreSQL database
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
cd Terra-Trionfo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update with your database credentials:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

### 4. Set Up the Database

Run Prisma migrations to create the database schema:

```bash
npm run prisma:migrate
```

### 5. Seed the Database

Populate the database with sample data (users, companies, products):

```bash
npm run prisma:seed
```

This creates:
- **Admin user**: admin@terratrionfo.com / password123
- **Vendor user**: vendor@example.com / password123 (with approved company)
- **Consumer user**: consumer@example.com / password123
- Sample products (marketplace, wholesale, and hybrid)
- Sample order history

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 👤 Test Accounts

Use these credentials to explore different user roles:

| Role     | Email                     | Password    | Access                          |
|----------|---------------------------|-------------|---------------------------------|
| Admin    | admin@terratrionfo.com    | password123 | Full platform management        |
| Vendor   | vendor@example.com        | password123 | Company & product management    |
| Consumer | consumer@example.com      | password123 | Shopping and order history      |

## 📱 Application Structure

```
Terra-Trionfo/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # NextAuth configuration
│   │   ├── users/             # User management
│   │   ├── companies/         # Company CRUD
│   │   ├── products/          # Product CRUD
│   │   ├── orders/            # Order processing
│   │   └── admin/             # Admin statistics
│   ├── auth/                  # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── products/              # Product catalog & detail
│   ├── cart/                  # Shopping cart
│   ├── dashboard/
│   │   ├── admin/            # Admin dashboard
│   │   └── vendor/           # Vendor dashboard
│   ├── account/              # User account pages
│   ├── layout.tsx            # Root layout with fonts
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   ├── layout/               # Header, Footer
│   ├── products/             # ProductCard
│   └── providers/            # AuthProvider
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # NextAuth configuration
│   └── cart.ts               # Cart utilities
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
└── types/
    └── next-auth.d.ts        # NextAuth type extensions
```

## 🎨 Key Pages & Flows

### Public Pages
- `/` - Landing page with hero, business model explanation, and CTAs
- `/products` - Filterable product catalog
- `/products/[id]` - Product detail with add to cart
- `/auth/signin` - Sign in page
- `/auth/signup` - Registration (choose Vendor or Consumer)

### Vendor Flow
1. Sign up as Vendor
2. Register company (pending admin approval)
3. Once approved, create products
4. Choose marketplace/wholesale per product
5. Set pricing based on model
6. Track products and status

### Admin Flow
1. Sign in as Admin
2. View dashboard with stats
3. Approve/reject companies
4. Approve/reject products
5. Override pricing and model settings
6. Monitor orders and revenue

### Consumer Flow
1. Browse products (approved only)
2. Add to cart
3. Proceed to checkout (mock payment)
4. View order history

## 🗃️ Database Schema

Key models:
- **User**: Authentication and role management (ADMIN, VENDOR, CONSUMER)
- **Company**: Vendor company profiles with approval status
- **Product**: Products with dual model flags and pricing options
- **Order**: Customer orders
- **OrderItem**: Line items with model type tracking
- **Settings**: Global platform settings (markup percentages, etc.)

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio (DB GUI)
npm run prisma:seed     # Seed database with sample data
```

## 🎯 Business Logic

### Marketplace Model
- Vendor sets `basePrice`
- System applies configurable markup (default 20%)
- Final `consumerPrice` = basePrice × (1 + markup%)
- Admin can override consumer price

### Wholesale Model
- Vendor sets `wholesaleCost` (what Terra Trionfo pays)
- Terra Trionfo/Admin sets `consumerPrice` directly
- Full control over retail pricing and margins

### Hybrid Products
- A product can have both flags enabled
- Useful for vendors testing different models
- Separate pricing logic applies to each model

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT-based session management via NextAuth
- Role-based access control (RBAC)
- Protected API routes
- Input validation

## 🚢 Deployment Notes

For production deployment:

1. Update `NEXTAUTH_SECRET` with a strong random string
2. Set `NEXTAUTH_URL` to your production domain
3. Configure production PostgreSQL database
4. Set up environment variables in your hosting platform
5. Run migrations: `npx prisma migrate deploy`
6. Build the application: `npm run build`

Recommended platforms:
- **Vercel** (seamless Next.js deployment)
- **Railway** or **Render** (with PostgreSQL)
- **AWS** / **DigitalOcean** (with containerization)

## 📄 License

Copyright © 2024 Trionfo Holding Co., Inc. All rights reserved.

## 🤝 Support

For questions or support, contact: info@terratrionfo.com

---

**Terra Trionfo** - *Born of the Land* 🌾
