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
import { localeDetector } from "../../shared/utils/locale-detection";

// KEEP ORIGINAL: Exact same translations object
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
    
    const [currentLocale, setCurrentLocale] = useState<'en' | 'vi'>(() => {
        const detected = localeDetector.detectLocale();
        return detected === 'vi' ? 'vi' : 'en';
    });
    
    useEffect(() => {
        localeDetector.saveLocale(currentLocale);
    }, [currentLocale]);
    
    const form = useForm<UserRepresentation>({ mode: "onChange" });
    const { handleSubmit, reset, setValue, setError } = form;
    const { addAlert } = useAccountAlerts();


    const translate = (key: keyof typeof translations.en): string => {
        return translations[currentLocale]?.[key] || translations.vi[key] || key;
    };

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

    const getDisplayName = () => {
        if (personalInfo.firstName && personalInfo.lastName) {
            return `${personalInfo.firstName} ${personalInfo.lastName}`;
        }
        return personalInfo.username || translate('defaultUser');
    };

    const getUserRoles = () => {
        const roles = personalInfo.attributes?.roles || context.keycloak?.realmAccess?.roles || [];
        const roleText = Array.isArray(roles) ? roles.join(', ') : roles;
        return roleText || translate('noRole');
    };

    const getPhoneNumber = () => {
        return personalInfo.attributes?.phone || 
               personalInfo.attributes?.phoneNumber || 
               personalInfo.attributes?.mobile || 
               translate('notUpdated');
    };

    const getDepartment = () => {
        return personalInfo.attributes?.department || 
               personalInfo.attributes?.phongban || 
               translate('notUpdated');
    };

    return (
        <div className="personal-info-container">
            <div className="avatar">
                <box-icon
                    name='user-circle'
                    type='solid'
                    size="lg"
                    className="avatar-icon"
                    color="#828c93"
                ></box-icon>
            </div>

            <div className="user-name">
                {getDisplayName()}
            </div>

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

            <button 
                className="change-password-btn"
                onClick={() => context.keycloak.login({ action: 'UPDATE_PASSWORD' })}
            >
                {translate('changePassword')}
            </button>

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