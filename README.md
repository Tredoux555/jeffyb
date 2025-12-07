# Jeffy Commerce App

A mobile-optimized commerce platform built with Next.js 14+, Supabase, and Tailwind CSS. Features include product management, order processing, delivery requests, and integration frameworks for payments and accounting.

## Features

### Public User Section
- **Splash Page**: Clean, sunny design with category navigation
- **Product Browsing**: Filter by category (Gym, Camping, Kitchen, Beauty)
- **Shopping Cart**: Add/remove items, quantity management
- **Checkout Flow**: Customer information, delivery details, payment integration
- **Mobile Optimized**: Responsive design with touch-friendly interfaces

### Admin Section
- **Dashboard**: Overview of products, orders, and deliveries
- **Product Management**: Add, edit, delete products with drag-and-drop image uploads
- **Order Management**: View and update order status
- **Delivery Management**: Handle pickup requests and product deliveries
- **Authentication**: Pre-configured admin login (admin@jeffy.com / jeffy123)

### Delivery Section
- **Pickup Requests**: Request products from shops for delivery
- **Send Products**: Send products from one location to another
- **ETA Estimation**: Framework for Google Maps Distance Matrix API integration
- **Admin Management**: Track and update delivery status

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Styling**: Custom yellow/grey theme with mobile-first design
- **Deployment**: Vercel
- **Integrations**: Stripe, PayPal, QuickBooks, Google Maps (frameworks ready)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd jeffyb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Get your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Payment Integration Keys (optional)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   
   # Google Maps API (optional)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # QuickBooks Integration (optional)
   QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
   QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
   
   # Anthropic Claude AI (optional - for AI tools)
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

5. **Run the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
jeffyb/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin section
│   ├── api/               # API routes
│   ├── checkout/          # Checkout flow
│   ├── delivery/          # Delivery requests
│   ├── products/          # Product browsing
│   └── page.tsx          # Home page
├── components/            # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Cart.tsx
│   ├── ImageUpload.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Navigation.tsx
│   └── ProductCard.tsx
├── lib/                   # Utility libraries
│   ├── accounting/        # QuickBooks integration
│   ├── maps/             # Google Maps integration
│   ├── payments/         # Stripe & PayPal integration
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript type definitions
│   └── database.ts
├── supabase-schema.sql    # Database schema
└── tailwind.config.ts    # Tailwind configuration
```

## Database Schema

The app uses the following main tables:

- **products**: Product catalog with categories, pricing, and inventory
- **orders**: Customer orders with items and delivery information
- **delivery_requests**: Pickup and send product requests
- **categories**: Product categories (Gym, Camping, Kitchen, Beauty)
- **admin_users**: Admin authentication

## Integration Setup

### Stripe Payment Integration

1. Create a Stripe account and get your API keys
2. Add keys to `.env.local`
3. The framework is ready - implement webhook handlers as needed

### PayPal Integration

1. Create a PayPal developer account
2. Get your client ID and secret
3. Add keys to `.env.local`
4. Configure webhook endpoints

### QuickBooks Integration

1. Create a QuickBooks app in the developer portal
2. Get OAuth credentials
3. Implement OAuth flow for company connection
4. Use the service to export orders and create invoices

### Google Maps Integration

1. Enable Distance Matrix API in Google Cloud Console
2. Get API key and add to `.env.local`
3. Use for ETA calculations and route optimization

## Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Use production Supabase project

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Custom domain can be configured in Vercel dashboard

### Supabase Production Setup

1. **Create Production Project**
   - Create a new Supabase project for production
   - Run the schema SQL file

2. **Configure Storage**
   - Set up production storage bucket
   - Configure CORS policies

3. **Update Environment Variables**
   - Use production Supabase URL and keys

## Admin Access

Default admin credentials:
- **Email**: admin@jeffy.com
- **Password**: jeffy123

Access the admin panel at `/admin/login`

## Features in Detail

### Product Management
- Drag-and-drop image uploads to Supabase Storage
- Real-time inventory tracking
- Category-based organization
- Mobile-optimized admin interface

### Order Processing
- Complete checkout flow with customer information
- Order status tracking (pending, processing, shipped, delivered)
- Integration points for payment processing
- Order history and management

### Delivery System
- Two types of delivery requests:
  - **Pickup**: Request products from shops
  - **Send Products**: Send products between locations
- ETA estimation framework
- Status tracking and management
- Special instructions support

### Mobile Optimization
- Touch-friendly interface
- Responsive design for all screen sizes
- Optimized images and loading
- Mobile-first navigation

### AI Tools (Powered by Claude)
Access AI-powered features at `/admin/ai-tools`:
- **Product Description Generator**: Create compelling product copy with SEO keywords
- **Smart Analytics Summary**: Get AI insights on your sales data and trends
- **Inventory Reorder Suggestions**: Smart recommendations for restocking
- **Product Request Analyzer**: Identify trends from "Jeffy Wants" customer requests
- **Marketing Copy Generator**: Create social posts, emails, and promo content
- **Site Improvement Advisor**: Get code-level suggestions for site improvements

To enable AI features, add your Anthropic API key to `.env.local`:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your API key at: https://console.anthropic.com/

## Customization

### Theme Colors
The app uses a custom yellow/grey theme defined in `tailwind.config.ts`:
- Primary yellow: `#FCD34D`
- Light yellow: `#FEF3C7`
- Grey backgrounds: `#9CA3AF`

### Adding New Categories
1. Add category to database
2. Update category list in components
3. Add appropriate icons

### Extending Integrations
All integration frameworks are modular and can be extended:
- Add new payment methods
- Integrate additional accounting software
- Add more mapping services

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are correct

2. **Image Upload Issues**
   - Verify Supabase Storage bucket exists
   - Check storage policies
   - Ensure file size limits are appropriate

3. **Payment Integration Issues**
   - Verify API keys are correct
   - Check webhook endpoints
   - Ensure proper error handling

### Development Tips

- Use Supabase dashboard to monitor database changes
- Check browser console for client-side errors
- Use Vercel function logs for server-side debugging
- Test on mobile devices for responsive issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

---

**Jeffy in a Jiffy** - Your mobile-optimized commerce platform! 🚀