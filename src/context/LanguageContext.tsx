import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.back': 'Back',
    // Hero
    'hero.tagline': 'Professional Cleaning Services',
    'hero.title': 'Make Your Space',
    'hero.subtitle': 'Sparkle & Shine',
    'hero.description': 'Experience the Flash Bright difference',
    'hero.description2': 'Professional cleaning services that transform your home into a spotless sanctuary',
    'hero.cta': 'Trusted professionals, flexible scheduling, and guaranteed satisfaction. Book your cleaning service today and let us handle the rest!',
    'hero.getStarted': 'Get Started Free',
    'hero.signIn': 'Sign In',
    'hero.verified': 'Verified Professionals',
    'hero.rated': '5-Star Rated',
    'hero.available': 'Available 24/7',
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Browse and book services directly',
    'services.loading': 'Loading services...',
    'services.viewDetails': 'View Details & Book',
    'services.backToServices': 'Back to Services',
    'services.basePrice': 'Base Price',
    'services.duration': 'Duration',
    'services.perHourFee': 'Per Hour Fee',
    'services.perPersonFee': 'Per Person Fee',
    'services.description': 'Description',
    'services.bookService': 'Book This Service',
    'services.bookServiceTitle': 'Book Service',
    'services.yourName': 'Your Name',
    'services.email': 'Email',
    'services.phone': 'Phone Number',
    'services.scheduledDate': 'Scheduled Date & Time',
    'services.serviceAddress': 'Service Address',
    'services.paymentMethod': 'Payment Method',
    'services.onlinePayment': 'Online Payment',
    'services.cashPayment': 'COD (Cash on Delivery)',
    'services.payOnline': 'Pay securely online with your card',
    'services.payCash': 'Pay cash when the service is completed',
    'services.numberOfHours': 'Number of Hours',
    'services.numberOfPeople': 'Number of People',
    'services.extraRequirements': 'Extra Requirements',
    'services.totalAmount': 'Total Amount',
    'services.specialInstructions': 'Special Instructions (Optional)',
    'services.confirmBooking': 'Confirm Booking',
    'services.cancel': 'Cancel',
    'services.hours': 'hours',
    'services.searchPlaceholder': 'Search for services...',
    'services.found': 'Found',
    'services.services': 'services',
    'services.clearSearch': 'Clear search',
    'services.noResults': 'No services found',
    'services.tryDifferent': 'Try a different search term',
    'services.viewAll': 'View All',
    'services.more': 'More Services',
    'services.allServices': 'All Services',
    'services.browseAll': 'Browse all our professional cleaning services',
    'services.from': 'from',
    // About
    'about.title': 'About Flash Bright',
    'about.mission': 'Our Mission',
    'about.vision': 'Our Vision',
    'about.values': 'Our Values',
    'about.subtitle': 'Your trusted partner in professional cleaning services across Dubai and the UAE',
    'about.missionText': 'To provide exceptional cleaning services that exceed customer expectations while maintaining the highest standards of quality, reliability, and professionalism. We are committed to creating clean, healthy, and comfortable environments for homes and businesses across Dubai.',
    'about.visionText': 'To become the leading cleaning service provider in Dubai and the UAE, recognized for our innovation, excellence, and unwavering commitment to customer satisfaction. We envision a future where every space we touch reflects our dedication to perfection.',
    'about.reliability': 'Reliability',
    'about.reliabilityText': 'We deliver on our promises, every time, without exception.',
    'about.excellence': 'Excellence',
    'about.excellenceText': 'We strive for perfection in every service we provide.',
    'about.customerFocus': 'Customer Focus',
    'about.customerFocusText': 'Your satisfaction is our top priority.',
    'about.readyToStart': 'Ready to Get Started?',
    'about.readyText': 'Book your cleaning service today and experience the Flash Bright difference!',
    // Login
    'login.title': 'Welcome Back',
    'login.subtitle': 'Sign in to your account',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.noAccount': "Don't have an account?",
    'login.signUp': 'Sign up',
    'login.demoAccounts': 'Demo Accounts:',
    'login.customer': 'Customer',
    'login.admin': 'Admin',
    'login.partner': 'Partner',
    'login.employee': 'Employee',
    'login.passwordLabel': 'Password',
    // Register
    'register.title': 'Create Account',
    'register.subtitle': 'Sign up to get started',
    'register.fullName': 'Full Name',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.role': 'Role',
    'register.registrationCode': 'Registration Code (provided by admin)',
    'register.customer': 'Customer',
    'register.partner': 'Partner',
    'register.employee': 'Employee',
    'register.signUp': 'Sign Up',
    'register.creatingAccount': 'Creating account...',
    'register.haveAccount': 'Already have an account?',
    'register.signIn': 'Sign in',
    // Common
    'common.back': 'Back',
    'common.whyChooseUs': 'Why Choose Flash Bright?',
    'common.whyChooseUsText': 'Experience the difference with our professional cleaning services',
    'common.topRated': 'Top Rated Professionals',
    'common.topRatedText': 'Our professionals are reliable & well-trained, with an average rating of 4.8 out of 5!',
    'common.sameDay': 'Same-Day Availability',
    'common.sameDayText': 'Book in less than 60 seconds, and even select same-day slots.',
    'common.superApp': 'Super App',
    'common.superAppText': 'Being a Super app means we\'ve got the widest range of home services, so we\'ve got you covered!',
    'common.home': 'Home',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.whyChooseUs': 'Why Choose Us?',
    'common.wideRange': 'Wide Range of Services',
    'common.wideRangeText': 'From deep cleaning to specialized maintenance',
    'common.verified': 'Verified Professionals',
    'common.verifiedText': 'All service providers are background checked',
    'common.flexible': 'Flexible Scheduling',
    'common.flexibleText': 'Book services at your convenience',
    'common.quality': 'Quality Guaranteed',
    'common.qualityText': '100% satisfaction or money back',
    // Breadcrumbs
    'breadcrumb.home': 'Home',
    'breadcrumb.services': 'Services',
    'breadcrumb.about': 'About',
    'breadcrumb.login': 'Login',
    'breadcrumb.register': 'Register',
    // Footer
    'footer.copyright': '© 2024 Flash Bright. All rights reserved.',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.services': 'الخدمات',
    'nav.about': 'من نحن',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.back': 'رجوع',
    // Hero
    'hero.tagline': 'خدمات تنظيف احترافية',
    'hero.title': 'اجعل مساحتك',
    'hero.subtitle': 'تلمع وتتألق',
    'hero.description': 'اختبر فرق Flash Bright',
    'hero.description2': 'خدمات تنظيف احترافية تحول منزلك إلى ملاذ نظيف',
    'hero.cta': 'محترفون موثوقون، جدولة مرنة، وضمان الرضا. احجز خدمة التنظيف الخاصة بك اليوم ودعنا نتعامل مع الباقي!',
    'hero.getStarted': 'ابدأ مجاناً',
    'hero.signIn': 'تسجيل الدخول',
    'hero.verified': 'محترفون موثوقون',
    'hero.rated': 'تقييم 5 نجوم',
    'hero.available': 'متاح 24/7',
    // Services
    'services.title': 'خدماتنا',
    'services.subtitle': 'تصفح واحجز الخدمات مباشرة',
    'services.loading': 'جاري تحميل الخدمات...',
    'services.viewDetails': 'عرض التفاصيل والحجز',
    'services.backToServices': 'العودة إلى الخدمات',
    'services.basePrice': 'السعر الأساسي',
    'services.duration': 'المدة',
    'services.perHourFee': 'رسوم الساعة',
    'services.perPersonFee': 'رسوم الفرد',
    'services.description': 'الوصف',
    'services.bookService': 'احجز هذه الخدمة',
    'services.bookServiceTitle': 'حجز الخدمة',
    'services.yourName': 'اسمك',
    'services.email': 'البريد الإلكتروني',
    'services.phone': 'رقم الهاتف',
    'services.scheduledDate': 'التاريخ والوقت المحدد',
    'services.serviceAddress': 'عنوان الخدمة',
    'services.paymentMethod': 'طريقة الدفع',
    'services.onlinePayment': 'الدفع عبر الإنترنت',
    'services.cashPayment': 'الدفع نقداً عند التسليم',
    'services.payOnline': 'ادفع بأمان عبر الإنترنت باستخدام بطاقتك',
    'services.payCash': 'ادفع نقداً عند اكتمال الخدمة',
    'services.numberOfHours': 'عدد الساعات',
    'services.numberOfPeople': 'عدد الأشخاص',
    'services.extraRequirements': 'متطلبات إضافية',
    'services.totalAmount': 'المبلغ الإجمالي',
    'services.specialInstructions': 'تعليمات خاصة (اختياري)',
    'services.confirmBooking': 'تأكيد الحجز',
    'services.cancel': 'إلغاء',
    'services.hours': 'ساعات',
    'services.searchPlaceholder': 'ابحث عن الخدمات...',
    'services.found': 'تم العثور على',
    'services.services': 'خدمة',
    'services.clearSearch': 'مسح البحث',
    'services.noResults': 'لم يتم العثور على خدمات',
    'services.tryDifferent': 'جرب مصطلح بحث مختلف',
    'services.viewAll': 'عرض الكل',
    'services.more': 'خدمات أخرى',
    'services.allServices': 'جميع الخدمات',
    'services.browseAll': 'تصفح جميع خدمات التنظيف الاحترافية لدينا',
    'services.from': 'من',
    // About
    'about.title': 'عن Flash Bright',
    'about.mission': 'مهمتنا',
    'about.vision': 'رؤيتنا',
    'about.values': 'قيمنا',
    'about.subtitle': 'شريكك الموثوق في خدمات التنظيف الاحترافية في جميع أنحاء دبي والإمارات العربية المتحدة',
    'about.missionText': 'تقديم خدمات تنظيف استثنائية تتجاوز توقعات العملاء مع الحفاظ على أعلى معايير الجودة والموثوقية والاحترافية. نحن ملتزمون بإنشاء بيئات نظيفة وصحية ومريحة للمنازل والشركات في جميع أنحاء دبي.',
    'about.visionText': 'أن نصبح مزود خدمات التنظيف الرائد في دبي والإمارات العربية المتحدة، معترف بنا لابتكارنا وتميزنا والتزامنا الثابت برضا العملاء. نتخيل مستقبلاً حيث يعكس كل مساحة نلمسها تفانينا في الكمال.',
    'about.reliability': 'الموثوقية',
    'about.reliabilityText': 'نحن نفي بوعودنا، في كل مرة، دون استثناء.',
    'about.excellence': 'التميز',
    'about.excellenceText': 'نسعى للكمال في كل خدمة نقدمها.',
    'about.customerFocus': 'التركيز على العملاء',
    'about.customerFocusText': 'رضاك هو أولويتنا القصوى.',
    'about.readyToStart': 'هل أنت مستعد للبدء؟',
    'about.readyText': 'احجز خدمة التنظيف الخاصة بك اليوم واختبر فرق Flash Bright!',
    // Login
    'login.title': 'مرحباً بعودتك',
    'login.subtitle': 'قم بتسجيل الدخول إلى حسابك',
    'login.email': 'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.signIn': 'تسجيل الدخول',
    'login.signingIn': 'جاري تسجيل الدخول...',
    'login.noAccount': 'ليس لديك حساب؟',
    'login.signUp': 'إنشاء حساب',
    'login.demoAccounts': 'حسابات تجريبية:',
    'login.customer': 'عميل',
    'login.admin': 'مدير',
    'login.partner': 'شريك',
    'login.employee': 'موظف',
    'login.passwordLabel': 'كلمة المرور',
    // Register
    'register.title': 'إنشاء حساب',
    'register.subtitle': 'سجل للبدء',
    'register.fullName': 'الاسم الكامل',
    'register.email': 'البريد الإلكتروني',
    'register.password': 'كلمة المرور',
    'register.role': 'الدور',
    'register.registrationCode': 'رمز التسجيل (مقدم من المدير)',
    'register.customer': 'عميل',
    'register.partner': 'شريك',
    'register.employee': 'موظف',
    'register.signUp': 'إنشاء حساب',
    'register.creatingAccount': 'جاري إنشاء الحساب...',
    'register.haveAccount': 'لديك حساب بالفعل؟',
    'register.signIn': 'تسجيل الدخول',
    // Common
    'common.back': 'رجوع',
    'common.home': 'الرئيسية',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.whyChooseUs': 'لماذا تختارنا؟',
    'common.wideRange': 'مجموعة واسعة من الخدمات',
    'common.wideRangeText': 'من التنظيف العميق إلى الصيانة المتخصصة',
    'common.verified': 'محترفون موثوقون',
    'common.verifiedText': 'جميع مقدمي الخدمات تم فحصهم',
    'common.flexible': 'جدولة مرنة',
    'common.flexibleText': 'احجز الخدمات في وقتك المناسب',
    'common.quality': 'ضمان الجودة',
    'common.qualityText': '100% رضا أو استرداد الأموال',
    // Breadcrumbs
    'breadcrumb.home': 'الرئيسية',
    'breadcrumb.services': 'الخدمات',
    'breadcrumb.about': 'من نحن',
    'breadcrumb.login': 'تسجيل الدخول',
    'breadcrumb.register': 'إنشاء حساب',
    // Footer
    'footer.copyright': '© 2024 Flash Bright. جميع الحقوق محفوظة.',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    // Add class to body for RTL support
    if (language === 'ar') {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    const currentTranslations = translations[language];
    const translation = currentTranslations[key as keyof typeof translations.en];
    // Fallback to English if translation not found
    if (!translation) {
      const englishTranslation = translations.en[key as keyof typeof translations.en];
      return englishTranslation || key;
    }
    return translation;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

