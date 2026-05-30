interface ApiConfig {
    baseURL: string;
    timeout: number;
}

const development: ApiConfig = {
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    timeout: 30000,
};

const production: ApiConfig = {
    baseURL: import.meta.env.VITE_API_URL || 'https://eventsandvotes.com.ng/api',
    timeout: 30000,
};

const config: ApiConfig = import.meta.env.MODE === 'production' ? production : development;

export default config; 