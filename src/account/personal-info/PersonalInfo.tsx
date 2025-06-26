/**
 * This file has been claimed for ownership from @keycloakify/keycloak-account-ui version 260200.1.3.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "account/personal-info/PersonalInfo.tsx" --revert
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
import { useState } from "react";
import { ErrorOption, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { getPersonalInfo, getSupportedLocales, savePersonalInfo } from "../api/methods";
import { UserProfileMetadata, UserRepresentation } from "../api/representations";
import { Page } from "../components/page/Page";
import type { Environment } from "../environment";
import { TFuncKey, i18n } from "../i18n";
import { useAccountAlerts } from "../utils/useAccountAlerts";
import { usePromise } from "../utils/usePromise";

export const PersonalInfo = () => {
    const { t } = useTranslation();
    const context = useEnvironment<Environment>();
    const [userProfileMetadata, setUserProfileMetadata] = useState<UserProfileMetadata>();
    const [supportedLocales, setSupportedLocales] = useState<string[]>([]);
    const [personalInfo, setPersonalInfo] = useState<UserRepresentation>();
    const form = useForm<UserRepresentation>({ mode: "onChange" });
    const { handleSubmit, reset, setValue, setError } = form;
    const { addAlert } = useAccountAlerts();

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

    // Custom styles
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            padding: '40px 20px',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh'
        },
        avatar: {
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: '#6c757d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
        },
        avatarIcon: {
            fontSize: '40px',
            color: 'white'
        },
        userName: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '30px'
        },
        infoCard: {
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            padding: '30px',
            width: '100%',
            maxWidth: '600px',
            marginBottom: '20px'
        },
        cardTitle: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center' as const,
            marginBottom: '25px',
            paddingBottom: '15px',
            borderBottom: '1px solid #e0e0e0'
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
        },
        infoItem: {
            display: 'flex',
            flexDirection: 'column' as const
        },
        label: {
            fontSize: '14px',
            color: '#666',
            marginBottom: '5px',
            fontWeight: '500'
        },
        value: {
            fontSize: '16px',
            color: '#333',
            fontWeight: '400'
        },
        changePasswordBtn: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        }
    };

    // Function to get display name
    const getDisplayName = () => {
        if (personalInfo.firstName && personalInfo.lastName) {
            return `${personalInfo.firstName} ${personalInfo.lastName}`;
        }
        return personalInfo.username || 'Người dùng';
    };

    // Function to get user roles
    const getUserRoles = () => {
        const roles = personalInfo.attributes?.roles || context.keycloak?.realmAccess?.roles || [];
        return Array.isArray(roles) ? roles.join(', ') : roles || 'Không có';
    };

    // Function to get phone number
    const getPhoneNumber = () => {
        return personalInfo.attributes?.phone || 
               personalInfo.attributes?.phoneNumber || 
               personalInfo.attributes?.mobile || 
               'Chưa cập nhật';
    };

    // Function to get department
    const getDepartment = () => {
        return personalInfo.attributes?.department || 
               personalInfo.attributes?.phongban || 
               'Chưa cập nhật';
    };

    return (
        <div style={styles.container}>
            {/* Avatar Section */}
            <div style={styles.avatar}>
                <UserIcon style={styles.avatarIcon} />
            </div>

            {/* User Name */}
            <div style={styles.userName}>
                {getDisplayName()}
            </div>

            {/* Personal Info Card */}
            <div style={styles.infoCard}>
                <div style={styles.cardTitle}>
                    Thông tin cá nhân
                </div>
                
                <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                        <div style={styles.label}>Họ và tên</div>
                        <div style={styles.value}>{getDisplayName()}</div>
                    </div>
                    
                    <div style={styles.infoItem}>
                        <div style={styles.label}>Email</div>
                        <div style={styles.value}>{personalInfo.email || 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div style={styles.infoItem}>
                        <div style={styles.label}>Chức vụ</div>
                        <div style={styles.value}>{getUserRoles()}</div>
                    </div>
                    
                    <div style={styles.infoItem}>
                        <div style={styles.label}>Số điện thoại</div>
                        <div style={styles.value}>{getPhoneNumber()}</div>
                    </div>
                    
                    <div style={styles.infoItem}>
                        <div style={styles.label}>Phòng ban</div>
                        <div style={styles.value}>{getDepartment()}</div>
                    </div>
                    
                    <div style={styles.infoItem}>
                        <div style={styles.label}>Trạng thái</div>
                        <div style={styles.value}>
                            {personalInfo.enabled ? 'Hoạt động' : 'Bị khóa'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Button */}
            <button 
                style={styles.changePasswordBtn}
                onClick={() => context.keycloak.login({ action: 'UPDATE_PASSWORD' })}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
                Đổi mật khẩu
            </button>

            {/* Optional: Additional Information Card */}
            {(personalInfo.attributes?.employeeId || personalInfo.createdTimestamp) && (
                <div style={{...styles.infoCard, marginTop: '20px'}}>
                    <div style={styles.cardTitle}>
                        Thông tin bổ sung
                    </div>
                    
                    <div style={styles.infoGrid}>
                        {personalInfo.attributes?.employeeId && (
                            <div style={styles.infoItem}>
                                <div style={styles.label}>Mã nhân viên</div>
                                <div style={styles.value}>{personalInfo.attributes.employeeId}</div>
                            </div>
                        )}
                        
                        {personalInfo.createdTimestamp && (
                            <div style={styles.infoItem}>
                                <div style={styles.label}>Ngày tạo tài khoản</div>
                                <div style={styles.value}>
                                    {new Date(personalInfo.createdTimestamp).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        )}
                        
                        <div style={styles.infoItem}>
                            <div style={styles.label}>Email đã xác thực</div>
                            <div style={styles.value}>
                                {personalInfo.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                            </div>
                        </div>
                        
                        <div style={styles.infoItem}>
                            <div style={styles.label}>Tên đăng nhập</div>
                            <div style={styles.value}>{personalInfo.username}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalInfo;