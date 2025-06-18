import { i18nBuilder } from "keycloakify/login";
import type { ThemeName } from "../kc.gen";

/** @see: https://docs.keycloakify.dev/i18n */
const { useI18n, ofTypeI18n } = i18nBuilder
    .withThemeName<ThemeName>()
    .withExtraLanguages({
        'vi-VN': {
            label: "Tiếng Việt",
            getMessages: () => import("./lang/i18n.vn")
        },
    }).withCustomTranslations({
        en: {
            invalidUsernameOrEmailMessage: "The username or password you entered is incorrect. Please try again.",
        }
    })
    .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };