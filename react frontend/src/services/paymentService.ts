export interface PaystackConfig {
    key: string;
    email: string;
    amount: number;
    ref: string;
    callback: (response: any) => void;
    onClose: () => void;
    currency?: string;
    metadata?: any;
}

export interface CheckoutData {
    full_name: string;
    customer_email: string;
    cart_items: Array<{
        nominee_id: string;
        quantity: number;
        vote_id: string;
    }>;
}

export interface PaymentResponse {
    status: string;
    message: string;
    data?: {
        transaction: any;
        amount: number;
        payment_gateway: any;
        metadata: any;
        paystack_data?: {
            authorization_url: string;
            access_code: string;
            reference: string;
            public_key: string;
        };
        monicredit_data?: {
            public_key: string;
            order_id: string;
            customer: {
                first_name: string;
                last_name: string;
                email: string;
                phone: string;
            };
            fee_bearer: string;
            items: Array<{
                item: string;
                unit_cost: string;
                revenue_head_code: string;
            }>;
            currency: string;
            paytype: string;
        };
    };
}

export interface PaymentCallbackResponse {
    status: string;
    message: string;
    data?: {
        transaction: any;
        payment_details: {
            amount_paid: number;
            gateway_response: string;
            channel: string;
            reference: string;
        };
    };
}

class PaymentService {
    private isPaystackLoaded = false;
    private isMonicreditLoaded = false;

    /**
     * Load Paystack script dynamically
     */
    private loadPaystackScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isPaystackLoaded || (window as any).PaystackPop) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => {
                this.isPaystackLoaded = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Paystack script'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Load Monicredit script dynamically
     */
    private loadMonicreditScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isMonicreditLoaded || (window as any).PayDirect) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://demo.monicredit.com/js/demo.js'; // Use demo for testing
            script.async = true;
            script.onload = () => {
                this.isMonicreditLoaded = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Monicredit script'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Initiate cart checkout
     */
    async initiateCheckout(checkoutData: CheckoutData): Promise<PaymentResponse> {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutData)
            });

            if (!response.ok) {
                const data = await response.json();
                console.log(data)
                throw new Error(data.status == 'error' ? data.message : 'Checkout request failed');
            }

            return await response.json();
        } catch (error: any) {
            throw new Error(error.message || 'Checkout failed');
        }
    }

    /**
     * Process payment with Paystack
     */
    async processPaystackPayment(
        paymentData: PaymentResponse['data'],
        customerEmail: string,
        onSuccess: (response: any) => void,
        onError: (error: string) => void,
        onClose: () => void
    ): Promise<void> {
        try {
            if (!paymentData?.paystack_data) {
                throw new Error('Invalid payment data');
            }

            await this.loadPaystackScript();

            const { paystack_data } = paymentData;

            // Ensure metadata is a valid object (Paystack requires plain object)
            const metaObj: any = {
                transaction_id: paymentData.transaction?.transaction_id || '',
                vote_id: paymentData.transaction?.vote_id || '',
                total_items: Array.isArray(paymentData.metadata) ? paymentData.metadata.length : 0,
            };

            const handler = (window as any).PaystackPop.setup({
                key: paystack_data.public_key,
                email: customerEmail,
                amount: paymentData.amount * 100, // Convert to kobo
                ref: paystack_data.reference,
                currency: 'NGN',
                callback: (response: any) => {
                    // Use promise style to avoid async function inside Paystack config
                    this.verifyPayment(response.reference)
                        .then(onSuccess)
                        .catch((err) => {
                            onError(err.message || 'Payment verification failed');
                        });
                },
                onClose: () => {
                    onClose();
                },
                metadata: metaObj
            });

            handler.openIframe();
        } catch (error: any) {
            onError(error.message || 'Payment initialization failed');
        }
    }

    /**
     * Verify payment on backend
     */
    async verifyPayment(reference: string): Promise<PaymentCallbackResponse> {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/checkout/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reference })
            });

            if (!response.ok) {
                throw new Error('Payment verification request failed');
            }

            return await response.json();
        } catch (error: any) {
            throw new Error(error.message || 'Payment verification failed');
        }
    }

    /**
     * Process payment with Monicredit
     */
    async processMonicreditPayment(
        paymentData: PaymentResponse['data'],
        onSuccess: (response: any) => void,
        onError: (error: string) => void,
        onClose: () => void
    ): Promise<void> {
        try {
            if (!paymentData?.monicredit_data) {
                throw new Error('Invalid Monicredit payment data');
            }

            await this.loadMonicreditScript();

            const { monicredit_data } = paymentData;

            const handler = (window as any).PayDirect.invoice({
                public_key: monicredit_data.public_key,
                order_id: monicredit_data.order_id,
                customer: monicredit_data.customer,
                fee_bearer: monicredit_data.fee_bearer,
                items: monicredit_data.items,
                currency: monicredit_data.currency,
                paytype: monicredit_data.paytype,
                callback: async (response: any) => {
                    try {
                        // Verify payment on backend
                        const verificationResponse = await this.verifyPayment(response.reference_code);
                        onSuccess(verificationResponse);
                    } catch (error: any) {
                        onError(error.message || 'Payment verification failed');
                    }
                },
                onClose: () => {
                    onClose();
                }
            });

            handler.openIframe();
        } catch (error: any) {
            onError(error.message || 'Monicredit payment initialization failed');
        }
    }

    /**
     * Process payment based on gateway type
     */
    async processPayment(
        paymentData: PaymentResponse['data'],
        customerEmail: string,
        onSuccess: (response: any) => void,
        onError: (error: string) => void,
        onClose: () => void
    ): Promise<void> {
        if (!paymentData?.payment_gateway) {
            onError('No payment gateway specified');
            return;
        }

        const gatewaySlug = paymentData.payment_gateway.slug;

        switch (gatewaySlug) {
            case 'paystack':
                await this.processPaystackPayment(paymentData, customerEmail, onSuccess, onError, onClose);
                break;
            case 'monicredit':
                await this.processMonicreditPayment(paymentData, onSuccess, onError, onClose);
                break;
            default:
                onError(`Unsupported payment gateway: ${gatewaySlug}`);
        }
    }

    /**
     * Complete checkout flow
     */
    async completeCheckout(
        checkoutData: CheckoutData,
        onSuccess: (response: PaymentCallbackResponse) => void,
        onError: (error: string) => void,
        onClose: () => void
    ): Promise<void> {
        try {
            // Step 1: Initiate checkout
            const paymentResponse = await this.initiateCheckout(checkoutData);

            if (paymentResponse.status !== 'success') {
                throw new Error(paymentResponse.message);
            }

            // Step 2: Process payment with Paystack
            await this.processPayment(
                paymentResponse.data,
                checkoutData.customer_email,
                onSuccess,
                onError,
                onClose
            );
        } catch (error: any) {
            onError(error.message || 'Checkout failed');
        }
    }

    /**
     * Get payment gateways
     */
    async getPaymentGateways() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payment-gateways`);

            if (!response.ok) {
                throw new Error('Failed to fetch payment gateways');
            }

            return await response.json();
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch payment gateways');
        }
    }
}

export const paymentService = new PaymentService();
export default paymentService; 