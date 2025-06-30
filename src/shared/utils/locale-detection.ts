import React from 'react';

export type SupportedLocale = 'en' | 'vi' | 'vi-VN';

export interface LocaleDetectionConfig {
    defaultLocale?: SupportedLocale;
    storageKey?: string;
    urlParams?: string[];
    fallbackToNavigator?: boolean;
}

export class LocaleDetector {
    private config: Required<LocaleDetectionConfig>;

    constructor(config: LocaleDetectionConfig = {}) {
        this.config = {
            defaultLocale: 'en',
            storageKey: 'app-locale',
            urlParams: ['kc_locale', 'locale', 'lang', 'ui_locales'],
            fallbackToNavigator: true,
            ...config
        };
    }

    detectLocale(): SupportedLocale {
        const urlLocale = this.getLocaleFromUrl();
        if (urlLocale) {
            this.saveLocale(urlLocale);
            return urlLocale;
        }

        const savedLocale = this.getLocaleFromStorage();
        if (savedLocale) {
            return savedLocale;
        }

        if (this.config.fallbackToNavigator) {
            const navigatorLocale = this.getLocaleFromNavigator();
            if (navigatorLocale) {
                this.saveLocale(navigatorLocale);
                return navigatorLocale;
            }
        }

        this.saveLocale(this.config.defaultLocale);
        return this.config.defaultLocale;
    }

    private getLocaleFromUrl(): SupportedLocale | null {
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const param of this.config.urlParams) {
            const value = urlParams.get(param);
            if (value) {
                const normalizedLocale = this.normalizeLocale(value);
                if (normalizedLocale) {
                    return normalizedLocale;
                }
            }
        }

        return null;
    }

    private getLocaleFromStorage(): SupportedLocale | null {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const normalized = this.normalizeLocale(saved);
                if (normalized) {
                    return normalized;
                }
            }
        } catch (error) {
            // Silent fail
        }
        return null;
    }

    private getLocaleFromNavigator(): SupportedLocale | null {
        try {
            const navigatorLang = navigator.language || navigator.languages?.[0];
            if (navigatorLang) {
                const normalized = this.normalizeLocale(navigatorLang);
                if (normalized) {
                    return normalized;
                }
            }
        } catch (error) {
            // Silent fail
        }
        return null;
    }

    private normalizeLocale(locale: string): SupportedLocale | null {
        const cleaned = locale.toLowerCase().trim();
        
        if (cleaned === 'en' || cleaned === 'en-us') return 'en';
        if (cleaned === 'vi' || cleaned === 'vi-vn') return 'vi';
        
        if (cleaned.startsWith('vi')) return 'vi';
        if (cleaned.startsWith('en')) return 'en';
        
        return null;
    }

    saveLocale(locale: SupportedLocale): void {
        try {
            localStorage.setItem(this.config.storageKey, locale);
        } catch (error) {
            // Silent fail
        }
    }

    // TODO: Uncomment khi muốn app flutter có chức năng chọn ngôn ngữ
    /*
    setupFlutterListener(callback: (locale: SupportedLocale) => void): () => void {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SET_LOCALE') {
                const newLocale = this.normalizeLocale(event.data.locale);
                if (newLocale) {
                    this.saveLocale(newLocale);
                    callback(newLocale);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        
        return () => window.removeEventListener('message', handleMessage);
    }
    */

    toKeycloakLocale(locale: SupportedLocale): string {
        switch (locale) {
            case 'vi':
                return 'vi-VN';
            case 'en':
                return 'en';
            default:
                return 'en';
        }
    }

    getUrlWithLocale(locale: SupportedLocale, baseUrl?: string): string {
        const url = new URL(baseUrl || window.location.href);
        url.searchParams.set('kc_locale', this.toKeycloakLocale(locale));
        return url.toString();
    }
}

export const localeDetector = new LocaleDetector();

export const useLocaleDetection = () => {
    const [currentLocale, setCurrentLocale] = React.useState<SupportedLocale>(
        () => localeDetector.detectLocale()
    );

    /*
    React.useEffect(() => {
        const cleanup = localeDetector.setupFlutterListener((newLocale) => {
            setCurrentLocale(newLocale);
        });

        return cleanup;
    }, []);
    */

    const changeLocale = (locale: SupportedLocale) => {
        localeDetector.saveLocale(locale);
        setCurrentLocale(locale);
    };

    return {
        currentLocale,
        changeLocale,
        getUrlWithLocale: localeDetector.getUrlWithLocale.bind(localeDetector),
        toKeycloakLocale: localeDetector.toKeycloakLocale.bind(localeDetector)
    };
};