import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Pages
import { DashboardPage } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login'
import { MemberListPage } from '@/pages/members/MemberList'
import { MemberDetailPage } from '@/pages/members/MemberDetail'
import { MemberCreatePage } from '@/pages/members/MemberCreate'
import { MemberEditPage } from '@/pages/members/MemberEdit'
import { VendorsPage } from '@/pages/Vendors'
import { VendorDetailPage } from '@/pages/Vendors/VendorDetail'
import { VendorCreatePage } from '@/pages/Vendors/VendorCreate'
import { VendorEditPage } from '@/pages/Vendors/VendorEdit'
import { CategoriesPage } from '@/pages/Categories'
import { CategoryDetailPage } from '@/pages/Categories/CategoryDetail'
import { CategoryCreatePage } from '@/pages/Categories/CategoryCreate'
import { CategoryEditPage } from '@/pages/Categories/CategoryEdit'
import { ProductsPage } from '@/pages/Products'
import { ProductDetailPage } from '@/pages/Products/ProductDetail'
import { ProductCreatePage } from '@/pages/Products/ProductCreate'
import { ProductEditPage } from '@/pages/Products/ProductEdit'
import { ReviewsPage } from '@/pages/Reviews'
import { ReviewDetailPage } from '@/pages/Reviews/ReviewDetail'
import { ReservationsPage } from '@/pages/Reservations'
import { ReservationDetailPage } from '@/pages/Reservations/ReservationDetail'
import { PaymentsPage } from '@/pages/Payments'
import { PaymentDetailPage } from '@/pages/Payments/PaymentDetail'

// Content Pages
import { NoticesPage } from '@/pages/content/Notices'
import { NoticeDetailPage } from '@/pages/content/Notices/NoticeDetail'
import { NoticeCreatePage } from '@/pages/content/Notices/NoticeCreate'
import { NoticeEditPage } from '@/pages/content/Notices/NoticeEdit'
import { FAQsPage } from '@/pages/content/FAQs'
import { FAQDetailPage } from '@/pages/content/FAQs/FAQDetail'
import { FAQCreatePage } from '@/pages/content/FAQs/FAQCreate'
import { FAQEditPage } from '@/pages/content/FAQs/FAQEdit'
import { BannersPage } from '@/pages/content/Banners'
import { BannerDetailPage } from '@/pages/content/Banners/BannerDetail'
import { BannerCreatePage } from '@/pages/content/Banners/BannerCreate'
import { BannerEditPage } from '@/pages/content/Banners/BannerEdit'
import { PopupsPage } from '@/pages/content/Popups'
import { PopupDetailPage } from '@/pages/content/Popups/PopupDetail'
import { PopupCreatePage } from '@/pages/content/Popups/PopupCreate'
import { PopupEditPage } from '@/pages/content/Popups/PopupEdit'
import { AdBannersPage } from '@/pages/content/AdBanners'
import { AdBannerDetailPage } from '@/pages/content/AdBanners/AdBannerDetail'
import { AdBannerCreatePage } from '@/pages/content/AdBanners/AdBannerCreate'
import { AdBannerEditPage } from '@/pages/content/AdBanners/AdBannerEdit'
import { LegalDocumentsPage } from '@/pages/content/LegalDocuments'
import { LegalDocumentDetailPage } from '@/pages/content/LegalDocuments/LegalDocumentDetail'
import { LegalDocumentCreatePage } from '@/pages/content/LegalDocuments/LegalDocumentCreate'

// Settings Pages
import { SettingsPage } from '@/pages/settings'
import { ServiceSettingsPage } from '@/pages/settings/ServiceSettings'
import { AdminLogsPage } from '@/pages/settings/AdminLogs'

// 라우터 설정
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'members',
        element: <MemberListPage />,
      },
      {
        path: 'members/new',
        element: <MemberCreatePage />,
      },
      {
        path: 'members/:id',
        element: <MemberDetailPage />,
      },
      {
        path: 'members/:id/edit',
        element: <MemberEditPage />,
      },
      {
        path: 'vendors',
        element: <VendorsPage />,
      },
      {
        path: 'vendors/new',
        element: <VendorCreatePage />,
      },
      {
        path: 'vendors/:id',
        element: <VendorDetailPage />,
      },
      {
        path: 'vendors/:id/edit',
        element: <VendorEditPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'categories/new',
        element: <CategoryCreatePage />,
      },
      {
        path: 'categories/:id',
        element: <CategoryDetailPage />,
      },
      {
        path: 'categories/:id/edit',
        element: <CategoryEditPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'products/new',
        element: <ProductCreatePage />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'products/:id/edit',
        element: <ProductEditPage />,
      },
      {
        path: 'reviews',
        element: <ReviewsPage />,
      },
      {
        path: 'reviews/:id',
        element: <ReviewDetailPage />,
      },
      {
        path: 'reservations',
        element: <ReservationsPage />,
      },
      {
        path: 'reservations/:id',
        element: <ReservationDetailPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      {
        path: 'payments/:id',
        element: <PaymentDetailPage />,
      },
      // Content - Notices
      {
        path: 'content/notices',
        element: <NoticesPage />,
      },
      {
        path: 'content/notices/new',
        element: <NoticeCreatePage />,
      },
      {
        path: 'content/notices/:id',
        element: <NoticeDetailPage />,
      },
      {
        path: 'content/notices/:id/edit',
        element: <NoticeEditPage />,
      },
      // Content - FAQs
      {
        path: 'content/faqs',
        element: <FAQsPage />,
      },
      {
        path: 'content/faqs/new',
        element: <FAQCreatePage />,
      },
      {
        path: 'content/faqs/:id',
        element: <FAQDetailPage />,
      },
      {
        path: 'content/faqs/:id/edit',
        element: <FAQEditPage />,
      },
      // Content - Banners
      {
        path: 'content/banners',
        element: <BannersPage />,
      },
      {
        path: 'content/banners/new',
        element: <BannerCreatePage />,
      },
      {
        path: 'content/banners/:id',
        element: <BannerDetailPage />,
      },
      {
        path: 'content/banners/:id/edit',
        element: <BannerEditPage />,
      },
      // Content - Popups
      {
        path: 'content/popups',
        element: <PopupsPage />,
      },
      {
        path: 'content/popups/new',
        element: <PopupCreatePage />,
      },
      {
        path: 'content/popups/:id',
        element: <PopupDetailPage />,
      },
      {
        path: 'content/popups/:id/edit',
        element: <PopupEditPage />,
      },
      // Content - Ad Banners
      {
        path: 'content/ad-banners',
        element: <AdBannersPage />,
      },
      {
        path: 'content/ad-banners/new',
        element: <AdBannerCreatePage />,
      },
      {
        path: 'content/ad-banners/:id',
        element: <AdBannerDetailPage />,
      },
      {
        path: 'content/ad-banners/:id/edit',
        element: <AdBannerEditPage />,
      },
      // Content - Legal Documents
      {
        path: 'content/legal-documents',
        element: <LegalDocumentsPage />,
      },
      {
        path: 'content/legal-documents/new',
        element: <LegalDocumentCreatePage />,
      },
      {
        path: 'content/legal-documents/:id',
        element: <LegalDocumentDetailPage />,
      },
      // Settings
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'settings/service',
        element: <ServiceSettingsPage />,
      },
      {
        path: 'settings/logs',
        element: <AdminLogsPage />,
      },
    ],
  },
])
