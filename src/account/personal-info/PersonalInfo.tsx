/**
 * PersonalInfo with URL locale detection for Flutter WebView
 */

/* eslint-disable */
// @ts-nocheck

import {
    UserProfileFields,
    beerify,
    debeerify,
    setUserProfileServerError,
    useEnvironment
} from "../../shared/keycloak-ui-shared";
import {
    ActionGroup,
    Alert,
    AlertVariant,
    Button,
    ExpandableSection,
    Form,
    Spinner,
    Card,
    CardBody,
    CardTitle,
    Grid,
    GridItem,
    Text,
    TextVariants
} from "../../shared/@patternfly/react-core";
import { ExternalLinkSquareAltIcon, UserIcon } from "../../shared/@patternfly/react-icons";
import { TFunction } from "i18next";
import { useState, useEffect } from "react";
import { ErrorOption, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import 'boxicons';

import { getPersonalInfo, getSupportedLocales, savePersonalInfo } from "../api/methods";
import { UserProfileMetadata, UserRepresentation } from "../api/representations";
import { Page } from "../components/page/Page";
import type { Environment } from "../environment";
import { TFuncKey, i18n } from "../i18n";
import { useAccountAlerts } from "../utils/useAccountAlerts";
import { usePromise } from "../utils/usePromise";
import './PersonalInfo.css';

// Translations
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

export const PersonalInfo = () => {
    const { t } = useTranslation();
    const context = useEnvironment<Environment>();
    const [userProfileMetadata, setUserProfileMetadata] = useState<UserProfileMetadata>();
    const [supportedLocales, setSupportedLocales] = useState<string[]>([]);
    const [personalInfo, setPersonalInfo] = useState<UserRepresentation>();
    const [currentLocale, setCurrentLocale] = useState<'en' | 'vi'>('vi');
    const form = useForm<UserRepresentation>({ mode: "onChange" });
    const { handleSubmit, reset, setValue, setError } = form;
    const { addAlert } = useAccountAlerts();

    // Function to get URL parameter
    const getUrlParameter = (name: string): string | null => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    };

    // Function to detect language from multiple sources
    const detectLanguage = (): 'en' | 'vi' => {
        // 1. Check URL parameter (từ Flutter app)
        const urlLocale = getUrlParameter('kc_locale') || getUrlParameter('locale') || getUrlParameter('lang');
        if (urlLocale) {
            const detectedLang = urlLocale.startsWith('vi') ? 'vi' : 'en';
            return detectedLang;
        }

        // 2. Check localStorage
        const savedLang = localStorage.getItem('app-locale');
        if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
            return savedLang as 'en' | 'vi';
        }

        // 3. Check user agent language (for WebView)
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            // Trong WebView, thử detect từ accept-language header
            const browserLang = navigator.language || navigator.languages?.[0] || 'vi';
            const detectedLang = browserLang.startsWith('vi') ? 'vi' : 'en';
            return detectedLang;
        }

        return 'en';
    };

    // Initialize locale
    useEffect(() => {
        const detectedLang = detectLanguage();
        setCurrentLocale(detectedLang);
        localStorage.setItem('app-locale', detectedLang);
    }, []);

    // Listen for postMessage from Flutter app
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SET_LOCALE') {
                const newLocale = event.data.locale;
                if (newLocale === 'en' || newLocale === 'vi') {
                    setCurrentLocale(newLocale);
                    localStorage.setItem('app-locale', newLocale);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Translation function
    const translate = (key: keyof typeof translations.en): string => {
        return translations[currentLocale]?.[key] || translations.vi[key] || key;
    };

    // Format date based on locale
    const formatDate = (timestamp: number): string => {
        const locale = currentLocale === 'en' ? 'en-US' : 'vi-VN';
        return new Date(timestamp).toLocaleDateString(locale);
    };

    usePromise(
        signal =>
            Promise.all([
                getPersonalInfo({ signal, context }),
                getSupportedLocales({ signal, context })
            ]),
        ([personalInfo, supportedLocales]) => {
            setUserProfileMetadata(personalInfo.userProfileMetadata);
            setSupportedLocales(supportedLocales);
            setPersonalInfo(personalInfo);
            reset(personalInfo);
            Object.entries(personalInfo.attributes || {}).forEach(([k, v]) =>
                setValue(`attributes[${beerify(k)}]`, v)
            );
        }
    );

    if (!userProfileMetadata || !personalInfo) {
        return <Spinner />;
    }

    // Function to get display name
    const getDisplayName = () => {
        if (personalInfo.firstName && personalInfo.lastName) {
            return `${personalInfo.firstName} ${personalInfo.lastName}`;
        }
        return personalInfo.username || translate('defaultUser');
    };

    // Function to get user roles
    const getUserRoles = () => {
        const roles = personalInfo.attributes?.roles || context.keycloak?.realmAccess?.roles || [];
        const roleText = Array.isArray(roles) ? roles.join(', ') : roles;
        return roleText || translate('noRole');
    };

    // Function to get phone number
    const getPhoneNumber = () => {
        return personalInfo.attributes?.phone || 
               personalInfo.attributes?.phoneNumber || 
               personalInfo.attributes?.mobile || 
               translate('notUpdated');
    };

    // Function to get department
    const getDepartment = () => {
        return personalInfo.attributes?.department || 
               personalInfo.attributes?.phongban || 
               translate('notUpdated');
    };

    return (
        <div className="personal-info-container">
            {/* Avatar Section */}
            <div className="avatar">
                <box-icon
                    name='user-circle'
                    type='solid'
                    size="lg"
                    className="avatar-icon"
                    color="#828c93"
                ></box-icon>
            </div>

            {/* User Name */}
            <div className="user-name">
                {getDisplayName()}
            </div>

            {/* Personal Info Card */}
            <div className="info-card">
                <div className="card-title">
                    {translate('personalInformation')}
                </div>
                
                <div className="info-grid">
                    <div className="info-item">
                        <div className="label">{translate('fullName')}</div>
                        <div className="value">{getDisplayName()}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">{translate('email')}</div>
                        <div className="value">{personalInfo.email || translate('notUpdated')}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">{translate('position')}</div>
                        <div className="value">{getUserRoles()}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">{translate('phoneNumber')}</div>
                        <div className="value">{getPhoneNumber()}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">{translate('department')}</div>
                        <div className="value">{getDepartment()}</div>
                    </div>
                </div>
            </div>

            {/* Change Password Button */}
            <button 
                className="change-password-btn"
                onClick={() => context.keycloak.login({ action: 'UPDATE_PASSWORD' })}
            >
                {translate('changePassword')}
            </button>

            {/* Additional Information Card */}
            {(personalInfo.attributes?.employeeId || personalInfo.createdTimestamp) && (
                <div className="info-card additional-info">
                    <div className="card-title">
                        {translate('additionalInformation')}
                    </div>
                    
                    <div className="info-grid">
                        {personalInfo.attributes?.employeeId && (
                            <div className="info-item">
                                <div className="label">{translate('employeeId')}</div>
                                <div className="value">{personalInfo.attributes.employeeId}</div>
                            </div>
                        )}
                        
                        {personalInfo.createdTimestamp && (
                            <div className="info-item">
                                <div className="label">{translate('accountCreated')}</div>
                                <div className="value">
                                    {formatDate(personalInfo.createdTimestamp)}
                                </div>
                            </div>
                        )}
                        
                        <div className="info-item">
                            <div className="label">{translate('emailVerified')}</div>
                            <div className="value">
                                {personalInfo.emailVerified ? 
                                    translate('verified') : 
                                    translate('notVerified')
                                }
                            </div>
                        </div>
                        
                        <div className="info-item">
                            <div className="label">{translate('username')}</div>
                            <div className="value">{personalInfo.username}</div>
                        </div>

                        <div className="info-item">
                            <div className="label">{translate('accountStatus')}</div>
                            <div className="value">
                                {personalInfo.enabled ? 
                                    translate('active') : 
                                    translate('locked')
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalInfo;