/**
 * Simple localization utility without external dependencies
 * Place this in src/account/utils/localization.ts
 */

import React from 'react';

// Translation resources
const translations = {
  en: {
    personalInformation: "Personal Information",
    additionalInformation: "Additional Information",
    fullName: "Full Name",
    email: "Email",
    position: "Position",
    phoneNumber: "Phone Number",
    department: "Department",
    employeeId: "Employee ID",
    accountCreated: "Account Created",
    emailVerified: "Email Verified",
    username: "Username",
    accountStatus: "Account Status",
    changePassword: "Change Password",
    defaultUser: "User",
    noRole: "None",
    notUpdated: "Not updated",
    verified: "Verified",
    notVerified: "Not verified",
    active: "Active",
    locked: "Locked"
  },
  vi: {
    personalInformation: "Thông tin cá nhân",
    additionalInformation: "Thông tin bổ sung",
    fullName: "Họ và tên",
    email: "Email",
    position: "Chức vụ",
    phoneNumber: "Số điện thoại",
    department: "Phòng ban",
    employeeId: "Mã nhân viên",
    accountCreated: "Ngày tạo tài khoản",
    emailVerified: "Email đã xác thực",
    username: "Tên đăng nhập",
    accountStatus: "Trạng thái",
    changePassword: "Đổi mật khẩu",
    defaultUser: "Người dùng",
    noRole: "Không có",
    notUpdated: "Chưa cập nhật",
    verified: "Đã xác thực",
    notVerified: "Chưa xác thực",
    active: "Hoạt động",
    locked: "Bị khóa"
  }
};

type TranslationKey = keyof typeof translations.en;
type Locale = keyof typeof translations;

/**
 * Detect user's preferred language
 */
export const detectUserLanguage = (): Locale => {
  // 1. Check localStorage
  const savedLang = localStorage.getItem('preferred-language') as Locale;
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }

  // 2. Check browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'vi';
  const detectedLang: Locale = browserLang.startsWith('en') ? 'en' : 'vi';

  // 3. Save detected language
  localStorage.setItem('preferred-language', detectedLang);
  
  return detectedLang;
};

/**
 * Translation hook
 */
export const useSimpleTranslation = () => {
  const [currentLocale, setCurrentLocale] = React.useState<Locale>(detectUserLanguage());

  const translate = (key: TranslationKey, fallback?: string): string => {
    const translation = translations[currentLocale]?.[key];
    return translation || fallback || key;
  };

  const changeLanguage = (locale: Locale) => {
    setCurrentLocale(locale);
    localStorage.setItem('preferred-language', locale);
  };

  const formatDate = (timestamp: number): string => {
    const locale = currentLocale === 'en' ? 'en-US' : 'vi-VN';
    return new Date(timestamp).toLocaleDateString(locale);
  };

  return {
    translate,
    currentLocale,
    changeLanguage,
    formatDate
  };
};

// Export for direct use
export const getTranslation = (key: TranslationKey, locale?: Locale, fallback?: string): string => {
  const currentLocale = locale || detectUserLanguage();
  return translations[currentLocale]?.[key] || fallback || key;
};