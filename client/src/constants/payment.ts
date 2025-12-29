export const PAYMENT_METHODS = {
    CASH: 'CASH',
    BANK_TRANSFER: 'BANK_TRANSFER',
    QRIS: 'QRIS'
} as const;

export const PAYMENT_PROVIDERS = {
    MANUAL: 'MANUAL',
    XENDIT: 'XENDIT'
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;
export type PaymentProvider = keyof typeof PAYMENT_PROVIDERS;