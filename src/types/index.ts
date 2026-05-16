export type Role = 'admin' | 'business' | 'client' | 'user';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  language: 'ro' | 'en';
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  zone?: string | null;
  fcm_token?: string | null;
  account_type_chosen?: boolean | null;
  created_at: string;
}

export type OfferType = 'event' | 'limited_offer';
export type OfferStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'expired';
export type TargetType = 'all' | 'city' | 'zone' | 'followers' | 'category';

export interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  location: string;
  location_url: string;
  date: string;
  time: string;
  image_url: string;
  contact_link: string;
  phone: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  offer_type: OfferType;
  // Promotion
  is_promoted: boolean;
  promotion_starts_at: string | null;
  promotion_expires_at: string | null;
  promotion_priority: number;
  promotion_push_sent: boolean;
  // Business
  business_id?: string | null;
  old_price?: number | null;
  new_price?: number | null;
  discount_percent?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  target_type?: TargetType | null;
  target_city?: string | null;
  target_zone?: string | null;
  target_radius_km?: number | null;
  status?: OfferStatus | null;
  rejection_reason?: string | null;
  terms?: string | null;
}

export interface Business {
  id: string;
  owner_id: string;
  business_name: string;
  category: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  zone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  cover_image_url: string | null;
  opening_hours: Record<string, string> | null;
  website: string | null;
  social_links: Record<string, string> | null;
  is_approved: boolean;
  is_verified: boolean;
  subscription_plan: 'free' | 'basic' | 'pro' | 'premium';
  subscription_status: 'active' | 'expired' | 'cancelled' | 'pending';
  subscription_expires_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan: 'free' | 'basic' | 'pro' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  price: number;
  started_at: string | null;
  expires_at: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface BusinessFollower {
  id: string;
  user_id: string;
  business_id: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  business_id: string | null;
  offer_id: string | null;
  title: string;
  body: string | null;
  image_url: string | null;
  type: 'new_offer' | 'offer_expiring' | 'business_update';
  is_read: boolean;
  created_at: string;
}

export interface OfferStats {
  offer_id: string;
  business_id: string | null;
  views: number;
  clicks: number;
  saves: number;
  calls: number;
  directions: number;
  notifications_sent: number;
  unique_users: number;
  conversion_rate: number;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  offer_id: string;
  created_at: string;
}

export interface OfferEvent {
  id: string;
  offer_id: string;
  user_id: string | null;
  event_type: 'view' | 'click' | 'open_map' | 'favorite';
  created_at: string;
}

export interface PushLog {
  id: string;
  offer_id: string | null;
  title: string;
  body: string;
  sent_count: number;
  created_at: string;
}

export type Category = 'Cluburi' | 'Restaurante' | 'Evenimente' | 'Cafenele' | 'Activități' | 'Reduceri';

export const CATEGORIES: Category[] = ['Cluburi', 'Restaurante', 'Evenimente', 'Cafenele', 'Activități', 'Reduceri'];
export const CITIES = ['Buftea', 'București', 'Mogoșoaia', 'Chitila'];

export const translations = {
  ro: {
    home: 'Acasă',
    favorites: 'Favorite',
    profile: 'Profil',
    admin: 'Admin',
    business: 'Business',
    search: 'Caută activități, locuri...',
    popular: 'Populare azi',
    nearby: 'În apropiere',
    tonight: 'Diseară',
    weekend: 'Weekend',
    recommended: '🔥 Oferte recomandate',
    seeLocation: 'Vezi locația',
    goNow: '🗺️ Merg acum',
    save: 'Salvează',
    saved: 'Salvat',
    contact: 'Contactează',
    login: 'Intră în cont',
    signup: 'Creează cont',
    email: 'Email',
    password: 'Parolă',
    confirmPassword: 'Confirmă parola',
    forgotPassword: 'Ai uitat parola?',
    resetPassword: 'Resetează parola',
    newPassword: 'Parolă nouă',
    noAccount: 'Nu ai cont?',
    hasAccount: 'Ai deja cont?',
    logout: 'Deconectare',
    language: 'Limbă',
    createOffer: 'Adaugă ofertă',
    editOffer: 'Editează oferta',
    deleteOffer: 'Șterge oferta',
    title: 'Titlu',
    description: 'Descriere',
    category: 'Categorie',
    city: 'Oraș',
    area: 'Zonă',
    location: 'Locație',
    locationUrl: 'Link locație',
    date: 'Dată',
    time: 'Oră',
    image: 'Imagine',
    contactLink: 'Link contact',
    phone: 'Telefon',
    active: 'Activ',
    inactive: 'Inactiv',
    noOffers: 'Nicio ofertă disponibilă',
    noFavorites: 'Nu ai favorite încă',
    pullToRefresh: 'Trage pentru a reîmprospăta',
    refreshing: 'Se actualizează...',
    sendResetLink: 'Trimite link de resetare',
    resetSent: 'Link-ul a fost trimis pe email',
    passwordUpdated: 'Parola a fost actualizată',
    back: 'Înapoi',
    confirmEmail: 'Verifică-ți email-ul pentru confirmare',
    allCategories: 'Toate',
    promote: 'Promovează',
    removePromo: 'Scoate promo',
    sendPush: 'Trimite push',
    promoted: 'PROMO',
    totalOffers: 'Total oferte',
    activePromos: 'Promoții active',
    viewsToday: 'Views azi',
    clicksToday: 'Clickuri azi',
  },
  en: {
    home: 'Home',
    favorites: 'Favorites',
    profile: 'Profile',
    admin: 'Admin',
    business: 'Business',
    search: 'Search activities, places...',
    popular: 'Popular today',
    nearby: 'Nearby',
    tonight: 'Tonight',
    weekend: 'Weekend',
    recommended: '🔥 Recommended offers',
    seeLocation: 'See location',
    goNow: '🗺️ Go now',
    save: 'Save',
    saved: 'Saved',
    contact: 'Contact',
    login: 'Log in',
    signup: 'Sign up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset password',
    newPassword: 'New password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    logout: 'Log out',
    language: 'Language',
    createOffer: 'Create offer',
    editOffer: 'Edit offer',
    deleteOffer: 'Delete offer',
    title: 'Title',
    description: 'Description',
    category: 'Category',
    city: 'City',
    area: 'Area',
    location: 'Location',
    locationUrl: 'Location URL',
    date: 'Date',
    time: 'Time',
    image: 'Image',
    contactLink: 'Contact link',
    phone: 'Phone',
    active: 'Active',
    inactive: 'Inactive',
    noOffers: 'No offers available',
    noFavorites: 'No favorites yet',
    pullToRefresh: 'Pull to refresh',
    refreshing: 'Refreshing...',
    sendResetLink: 'Send reset link',
    resetSent: 'Reset link sent to email',
    passwordUpdated: 'Password updated',
    back: 'Back',
    confirmEmail: 'Check your email to confirm',
    allCategories: 'All',
    promote: 'Promote',
    removePromo: 'Remove promo',
    sendPush: 'Send push',
    promoted: 'PROMO',
    totalOffers: 'Total offers',
    activePromos: 'Active promos',
    viewsToday: 'Views today',
    clicksToday: 'Clicks today',
  },
};
