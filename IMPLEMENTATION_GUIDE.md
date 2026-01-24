# CLM Frontend - Implementation Guide

## Project Structure

```
CLM_Frontend/
├── clm-frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx      # Main layout wrapper
│   │   │   ├── SidebarV2.tsx            # Navigation sidebar
│   │   │   ├── DashboardPageV2.tsx      # Dashboard home
│   │   │   ├── TemplateLibraryV2.tsx    # Templates management
│   │   │   ├── ContractsPageV2.tsx      # Contracts list
│   │   │   ├── ApprovalsPageV2.tsx      # Approvals workflow
│   │   │   ├── AnalyticsDashboardV2.tsx # Analytics dashboard
│   │   │   └── SearchPageV2.tsx         # Advanced search
│   │   ├── analytics/
│   │   │   └── page.tsx                 # Analytics route
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Dashboard route
│   │   ├── templates/
│   │   │   └── page.tsx                 # Templates route
│   │   ├── contracts/
│   │   │   └── page.tsx                 # Contracts route
│   │   ├── approvals/
│   │   │   └── page.tsx                 # Approvals route
│   │   ├── search/
│   │   │   └── page.tsx                 # Search route
│   │   ├── lib/
│   │   │   ├── api-client.ts            # API client
│   │   │   └── auth-context.tsx         # Auth context
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx                     # Login page
│   ├── .env.local                       # Environment variables
│   ├── package.json
│   └── tailwind.config.ts
└── UI_REDESIGN_SUMMARY.md
```

## Component Architecture

### 1. DashboardLayout (Wrapper Component)
```tsx
<DashboardLayout
  title="Page Title"
  description="Page description"
  breadcrumbs={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Current Page" }
  ]}
>
  {/* Page content */}
</DashboardLayout>
```

**Features:**
- Automatic sidebar injection
- Header with breadcrumbs
- Responsive content area
- Consistent styling

### 2. SidebarV2 (Navigation)
**Navigation Items:**
- Dashboard → `/dashboard`
- Templates → `/templates`
- Contracts → `/contracts`
- Search → `/search`
- Approvals → `/approvals`
- Analytics → `/analytics`

**Features:**
- Collapsible menu
- Active state indicators
- User profile section
- Logout functionality
- Mobile responsive

## API Endpoints Integration

### Contracts API
```
GET  /api/v1/contracts/              # List all contracts
POST /api/v1/contracts/              # Create contract
GET  /api/v1/contracts/{id}/         # Get contract detail
PUT  /api/v1/contracts/{id}/         # Update contract
DELETE /api/v1/contracts/{id}/       # Delete contract
```

**Implementation:**
```tsx
const client = new ApiClient()
const response = await client.getContracts()
// Returns: { success: true, data: Contract[] }
```

### Templates API
```
GET  /api/v1/contract-templates/     # List templates
POST /api/v1/contract-templates/     # Create template
GET  /api/v1/contract-templates/{id}/ # Get template
POST /api/v1/templates/types/        # Get template types
```

**Implementation:**
```tsx
const response = await apiClient.getTemplates()
// Returns: { success: true, data: ContractTemplate[] }
```

### Search API
```
GET  /api/v1/search/                 # Full-text search
POST /api/v1/search/advanced/        # Advanced search with filters
```

**Query Parameters:**
- `q`: Search query (string)
- `type`: Filter by type (contract|template|clause)
- `status`: Filter by status
- `limit`: Results limit (default: 20)
- `offset`: Pagination offset

## Data Models

### Contract
```typescript
interface Contract {
  id: string
  title: string
  description?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  value?: number
  created_by?: string
}
```

### ContractTemplate
```typescript
interface ContractTemplate {
  id: string
  name: string
  contract_type: string
  description?: string
  r2_key?: string
  merge_fields?: string[]
  status: string
}
```

### SearchResult
```typescript
interface SearchResult {
  id: string
  title: string
  type: 'contract' | 'template' | 'clause'
  matches: number
  excerpt: string
  relevance: number
}
```

## Authentication

### Token Management
```tsx
// Login
const { login } = useAuth()
await login(email, password)

// Token storage
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')

// Logout
const { logout } = useAuth()
await logout()
```

### Protected Routes
All authenticated pages check:
```tsx
const { isAuthenticated, isLoading } = useAuth()

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/')
  }
}, [isLoading, isAuthenticated, router])
```

## Styling Guidelines

### Color Palette
```css
/* Primary Colors */
--primary: #3B82F6 (Blue)
--primary-dark: #1E40AF

/* Status Colors */
--success: #10B981 (Emerald - Approved)
--warning: #F59E0B (Amber - Pending)
--neutral: #64748B (Slate - Draft)
--danger: #EF4444 (Red - Rejected)

/* Backgrounds */
--bg-primary: #FFFFFF
--bg-secondary: #F8FAFC
--text-primary: #1E293B
--text-secondary: #64748B
```

### Spacing Scale
```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

### Border Radius
```css
sm: 4px
md: 8px
lg: 12px
full: 9999px
```

## Environment Configuration

### .env.local
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# App Configuration
NEXT_PUBLIC_APP_NAME=CLM System
NEXT_PUBLIC_MAX_FILE_SIZE=52428800

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Page Routes Map

| Component | Route | Icon | Description |
|-----------|-------|------|-------------|
| DashboardPageV2 | `/dashboard` | 📊 | Main dashboard with stats |
| TemplateLibraryV2 | `/templates` | 📋 | Contract templates library |
| ContractsPageV2 | `/contracts` | 📄 | All contracts management |
| ApprovalsPageV2 | `/approvals` | ✅ | Approval workflow |
| SearchPageV2 | `/search` | 🔍 | Advanced search |
| AnalyticsDashboardV2 | `/analytics` | 📈 | System analytics & monitoring |

## Common Patterns

### Fetching Data
```tsx
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [data, setData] = useState([])

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const client = new ApiClient()
      const response = await client.getContracts()
      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  fetchData()
}, [])
```

### Status Badges
```tsx
const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    draft: 'bg-slate-100 text-slate-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-700'
}

<span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
  {status}
</span>
```

### Loading States
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  )
}
```

## Performance Optimization

### Code Splitting
All page components use dynamic imports:
```tsx
export default function ContractsPage() {
  return <ContractsPageV2 />
}
```

### Image Optimization
- SVG icons (no image files)
- Tailwind CSS for styling
- No external image dependencies

### Bundle Size
- Tree-shaking enabled
- Minified production build
- CSS purging enabled

## Testing Scenarios

### User Flow 1: View Contracts
1. Login → Dashboard
2. Click "Contracts" in sidebar
3. View filterable list
4. Click contract → View details
5. Create new contract

### User Flow 2: Template Management
1. Navigate to Templates
2. Browse template library
3. Select template
4. View template details
5. Use template to create contract

### User Flow 3: Search
1. Navigate to Search
2. Enter search query
3. Filter by type
4. View results with relevance
5. Click result to view

### User Flow 4: Approvals
1. Navigate to Approvals
2. View pending approvals
3. Click approve/reject
4. Status updates
5. Filter approved/rejected

## Debugging Tips

### API Response Logging
```tsx
const response = await client.getContracts()
console.log('API Response:', response)
```

### Component Props Inspection
```tsx
console.log('Props:', { title, description, breadcrumbs })
```

### Redux DevTools (Future)
When Redux is implemented, use browser DevTools to inspect state changes.

## Build & Deployment

### Development
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

### Verification
```bash
# Check for errors
npm run lint

# Type check
npx tsc --noEmit
```

## Future Enhancements

- [ ] Dark mode support
- [ ] Advanced filtering options
- [ ] Batch operations on contracts
- [ ] Real-time notifications
- [ ] Document preview
- [ ] Signature integration
- [ ] Custom workflows
- [ ] Advanced analytics charts

---

**Last Updated**: January 24, 2025
**Version**: 1.0.0
**Status**: Production Ready
