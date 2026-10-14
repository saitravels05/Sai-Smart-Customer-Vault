export type SupportedLanguage = 'en' | 'ta';

export interface TranslationDictionary {
  meta: {
    language: SupportedLanguage;
    languageName: string;
    nativeName: string;
    dateFormat: string;
  };
  nav: {
    dashboard: string;
    customers: string;
    documentVault: string;
    aiReviewQueue: string;
    aiSearch: string;
    aiAssistant: string;
    expiryReminders: string;
    travelBookings: string;
    branches: string;
    auditCompliance: string;
    settings: string;
    newCustomer: string;
    uploadVault: string;
    logout: string;
  };
  branches: {
    maduraiHeadOffice: string;
    trichyBranchOffice: string;
    maduraiCode: string;
    trichyCode: string;
    maduraiAddress: string;
    trichyAddress: string;
    maduraiPhone: string;
    trichyPhone: string;
    maduraiEmail: string;
    trichyEmail: string;
    allBranches: string;
    switchBranch: string;
  };
  common: {
    search: string;
    searchPlaceholder: string;
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    close: string;
    export: string;
    filter: string;
    view: string;
    download: string;
    share: string;
    status: string;
    active: string;
    inactive: string;
    archived: string;
    expired: string;
    critical: string;
    high: string;
    medium: string;
    low: string;
    loading: string;
    refresh: string;
    actions: string;
    back: string;
    next: string;
    confirm: string;
    yes: string;
    no: string;
    created: string;
    updated: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalCustomers: string;
    activePassports: string;
    validVisas: string;
    pendingDocs: string;
    expiryRadar: string;
    quickActions: string;
    recentActivity: string;
    branchPerformance: string;
    daysCountdown: string;
    passportExpiringNotice: string;
  };
  customer: {
    directoryTitle: string;
    profile360Title: string;
    fullName: string;
    customerNumber: string;
    phone: string;
    email: string;
    passportNumber: string;
    passportExpiry: string;
    validityRadar: string;
    sixMonthRuleWarning: string;
    validForTravel: string;
    expiringSoon: string;
    expiredNotice: string;
    visasTitle: string;
    bookingsTitle: string;
    documentsTitle: string;
    notesTitle: string;
    duplicatesTitle: string;
    mergeProfiles: string;
    mergeWarning: string;
  };
  reminders: {
    title: string;
    subtitle: string;
    upcomingAlerts: string;
    sendWhatsapp: string;
    sendEmail: string;
    acknowledge: string;
    dismiss: string;
    daysRemaining: string;
    passportRenewalSubject: string;
    visaRenewalSubject: string;
    flightAlertSubject: string;
  };
}

/**
 * Generate bilingual WhatsApp message for customer passport renewal
 */
export function formatTamilPassportWhatsAppMessage(params: {
  customerName: string;
  passportNumberMasked: string;
  expiryDateStr: string;
  daysRemaining: number;
  branchName: string;
  branchPhone: string;
}): string {
  return [
    `*வணக்கம் ${params.customerName}!*`,
    `சாய் டூர்ஸ் & டிராவல்ஸ் (SAI TOURS & TRAVELS - ${params.branchName}) வழங்கும் முக்கிய கடவுச்சீட்டு காலாவதி அறிவிப்பு.`,
    ``,
    `உங்கள் கடவுச்சீட்டு எண்: *${params.passportNumberMasked}*`,
    `காலாவதி தேதி: *${params.expiryDateStr}* (${params.daysRemaining} நாட்களில் காலாவதியாகிறது)`,
    ``,
    `⚠️ *சர்வதேச பயண விதி:* சர்வதேச விமான பயணங்களுக்கு கடவுச்சீட்டு குறைந்தபட்சம் 6 மாதங்கள் செல்லுபடியாகும் நிலையில் இருக்க வேண்டும்.`,
    ``,
    `உடனடி கடவுச்சீட்டு புதுப்பித்தல் & விசா சேவைகளுக்கு எங்களை தொடர்பு கொள்ளவும்:`,
    `📞 தொலைபேசி: ${params.branchPhone}`,
    `🌐 இணையதளம்: https://www.saitravelservices.com/`,
    ``,
    `_சாய் டூர்ஸ் & டிராவல்ஸ் — உங்கள் நம்பிக்கைக்குரிய பயண வழிகாட்டி_`,
  ].join('\n');
}
