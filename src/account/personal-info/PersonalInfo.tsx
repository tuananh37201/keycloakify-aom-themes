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
import 'boxicons';

import { getPersonalInfo, getSupportedLocales, savePersonalInfo } from "../api/methods";
import { UserProfileMetadata, UserRepresentation } from "../api/representations";
import { Page } from "../components/page/Page";
import type { Environment } from "../environment";
import { TFuncKey, i18n } from "../i18n";
import { useAccountAlerts } from "../utils/useAccountAlerts";
import { usePromise } from "../utils/usePromise";
import './PersonalInfo.css';

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
                    Thông tin cá nhân
                </div>
                
                <div className="info-grid">
                    <div className="info-item">
                        <div className="label">Họ và tên</div>
                        <div className="value">{getDisplayName()}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">Email</div>
                        <div className="value">{personalInfo.email || 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">Chức vụ</div>
                        <div className="value">{getUserRoles()}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">Số điện thoại</div>
                        <div className="value">{getPhoneNumber()}</div>
                    </div>
                    
                    <div className="info-item">
                        <div className="label">Phòng ban</div>
                        <div className="value">{getDepartment()}</div>
                    </div>
                                 
                </div>
            </div>

            {/* Change Password Button */}
            <button 
                className="change-password-btn"
                onClick={() => context.keycloak.login({ action: 'UPDATE_PASSWORD' })}
            >
                Đổi mật khẩu
            </button>

            {/* Optional: Additional Information Card */}
            {(personalInfo.attributes?.employeeId || personalInfo.createdTimestamp) && (
                <div className="info-card additional-info">
                    <div className="card-title">
                        Thông tin bổ sung
                    </div>
                    
                    <div className="info-grid">
                        {personalInfo.attributes?.employeeId && (
                            <div className="info-item">
                                <div className="label">Mã nhân viên</div>
                                <div className="value">{personalInfo.attributes.employeeId}</div>
                            </div>
                        )}
                        
                        {personalInfo.createdTimestamp && (
                            <div className="info-item">
                                <div className="label">Ngày tạo tài khoản</div>
                                <div className="value">
                                    {new Date(personalInfo.createdTimestamp).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        )}
                        
                        <div className="info-item">
                            <div className="label">Email đã xác thực</div>
                            <div className="value">
                                {personalInfo.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                            </div>
                        </div>
                        
                        <div className="info-item">
                            <div className="label">Tên đăng nhập</div>
                            <div className="value">{personalInfo.username}</div>
                        </div>

                        <div className="info-item">
                            <div className="label">Trạng thái</div>
                             <div className="value">
                                {personalInfo.enabled ? 'Hoạt động' : 'Bị khóa'}
                             </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalInfo;