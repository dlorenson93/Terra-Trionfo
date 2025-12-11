# Terra Trionfo - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Make sure you have PostgreSQL running, then:
./setup.sh
```

The script will:
1. Install dependencies
2. Create .env file (you'll need to edit it)
3. Run database migrations
4. Seed sample data
5. You're ready to go!

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database
npm run prisma:migrate

# 4. Seed data
npm run prisma:seed

# 5. Start dev server
npm run dev
```

## 🎯 What You Get

### Pre-configured Test Accounts
- **Admin**: admin@terratrionfo.com / password123
- **Vendor**: vendor@example.com / password123
- **Consumer**: consumer@example.com / password123

### Sample Data
- 1 approved vendor company (Famiglia Rossi Farms)
- 6 products (mix of marketplace, wholesale, and hybrid)
- 1 sample order with multiple items
- Realistic Italian farm products with images

## 🎨 Design System

The app features a vintage Italian farmhouse aesthetic:

### Colors
- **Parchment**: Warm cream backgrounds (50-500 shades)
- **Olive**: Deep green accents (50-900 shades)
- Subtle gradients for depth

### Typography
- **Headings**: Playfair Display (serif) - elegant, classic
- **Body**: Inter (sans-serif) - clean, readable

### Components
- Rounded cards with subtle shadows
- Thin borders with olive tones
- Paper-like texture feel
- Trustworthy, artisanal vibe

## 📂 Key Files to Know

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Custom colors and fonts
- `.env` - Environment variables (DATABASE_URL, NEXTAUTH_SECRET)

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Sample data

### Authentication
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth endpoints

### Core Features
- `app/page.tsx` - Landing page
- `app/products/` - Product catalog and details
- `app/cart/` - Shopping cart
- `app/dashboard/admin/` - Admin panel
- `app/dashboard/vendor/` - Vendor portal
- `app/account/orders/` - Order history

## 🔍 Testing the App

### As Admin
1. Sign in with admin@terratrionfo.com
2. Go to Admin Dashboard
3. View stats, approve companies/products
4. Manage pricing and settings

### As Vendor
1. Sign in with vendor@example.com
2. View/edit company profile
3. Create new products
4. Choose marketplace or wholesale model
5. Set appropriate pricing

### As Consumer
1. Sign in with consumer@example.com
2. Browse products by category
3. Add items to cart
4. Complete mock checkout
5. View order history

## 🏗️ Architecture

### Frontend
- Next.js 14 App Router
- Server Components where possible
- Client Components for interactivity
- Tailwind for styling

### Backend
- Next.js API Routes
- Prisma ORM for database
- NextAuth for authentication
- Role-based access control

### Database Schema
- Users (with roles)
- Companies (vendor profiles)
- Products (with dual model flags)
- Orders & OrderItems
- Settings (global config)

## 🔐 Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT sessions via NextAuth
- API routes protected by role
- SQL injection prevented by Prisma
- No sensitive data in client code

## 🚀 Deployment Checklist

Before deploying to production:

1. ✅ Change NEXTAUTH_SECRET to a strong random value
2. ✅ Update DATABASE_URL to production database
3. ✅ Set NEXTAUTH_URL to production domain
4. ✅ Run migrations: `npx prisma migrate deploy`
5. ✅ Build app: `npm run build`
6. ✅ Test all user flows
7. ✅ Enable SSL/HTTPS
8. ✅ Set up monitoring and error tracking

## 📊 Business Models Explained

### Marketplace Model
```
Vendor sets: Base Price = $20
System adds: 20% markup
Result: Consumer Price = $24
Vendor gets: $20 (minus platform fee if any)
```

### Wholesale Model
```
Vendor sets: Wholesale Cost = $10 (what Terra pays)
Terra sets: Consumer Price = $30
Margin: $20 profit for Terra Trionfo
Vendor gets: $10 per unit sold
```

### Hybrid Product
```
Product can use BOTH models
Different pricing for each
Vendor chooses per transaction/order
Flexibility for testing markets
```

## 🎓 Next Steps

### Extend the Platform
- Add payment processing (Stripe, PayPal)
- Implement real shipping calculations
- Add product reviews and ratings
- Create vendor analytics dashboard
- Build mobile app (React Native)
- Add email notifications
- Implement inventory alerts

### Customize Branding
- Update logo in header
- Adjust color palette in tailwind.config.ts
- Modify typography fonts
- Add custom illustrations
- Create brand guidelines

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format in .env
- Ensure database exists: `createdb terra_trionfo`

### Migration Errors
- Reset database: `npx prisma migrate reset`
- Generate Prisma Client: `npx prisma generate`

### Build Errors
- Clear .next folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Authentication Issues
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your URL
- Clear browser cookies

## 📞 Support

Questions? Check the main README.md or contact info@terratrionfo.com

---

**Terra Trionfo** - *Born of the Land* 🌾
