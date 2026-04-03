const axios = require('axios');
//const qrcode = require('qrcode');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxy = "http://ip.atlantic-server.com:64433";
const agent = new HttpsProxyAgent(proxy);
axios.defaults.httpsAgent = agent;
axios.defaults.httpAgent = agent;

class OrderKuota {
    static API_URL = 'https://app.orderkuota.com:443/api/v2';
    static HOST = 'app.orderkuota.com';
    static CHECKER_HOST = 'checker.orderkuota.com';
    static USER_AGENT = 'okhttp/4.12.0';
    static APP_VERSION_NAME = '26.02.04';
    static APP_VERSION_CODE = '260204';
    static APP_REG_ID = 'db98wg1kQj-cXND4CdWjxe:APA91bEoXDQgwq6rpkUJSDi8qiIfeoHa3-ftWVVpwjDiZ0vOpbGb0wvylwd9wRQkqak60Ha7GvDcgo1yXIYI8YBwQLdVn2q9e5yNd3r9NblTea21CnaZBlE';

    #authToken;
    #username;

    #deviceParams = {
        phone_uuid: 'db98wg1kQj-cXND4CdWjxe',
        phone_model: 'SM-G935F',
        phone_android_version: '8.0.0',
        ui_mode: 'light'
    };

    constructor(username = false, authToken = false) {
        if (username) this.#username = username;
        if (authToken) this.#authToken = authToken;
    }

    async #requestLegacy(actionName, params = {}) {
        if (!this.#authToken || !this.#username) throw new Error("AuthToken and Username must be set.");
        const payload = new URLSearchParams({
            'auth_token': this.#authToken, 'auth_username': this.#username,
            'requests[0]': actionName, ...params
        }).toString();
        const headers = { 'Host': OrderKuota.HOST, 'User-Agent': OrderKuota.USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' };
        try {
            const response = await axios.post(`${OrderKuota.API_URL}/get`, payload, { headers });
            if (typeof response.data !== 'object') throw new Error(response.data);
            return response.data;
        } catch (error) {
            const errorMessage = error.response ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.message) : error.message;
            throw new Error(errorMessage);
        }
    }

    async #requestModern(payload) {
        const fullPayload = {
            ...payload, ...this.#deviceParams,
            app_reg_id: OrderKuota.APP_REG_ID, app_version_code: OrderKuota.APP_VERSION_CODE,
            app_version_name: OrderKuota.APP_VERSION_NAME, auth_username: this.#username,
            auth_token: this.#authToken
        };
        const headers = { 'Host': OrderKuota.HOST, 'User-Agent': OrderKuota.USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' };
        try {
            const response = await axios.post(`${OrderKuota.API_URL}/get`, new URLSearchParams(fullPayload).toString(), { headers });
            if (typeof response.data !== 'object') throw new Error(response.data);
            return response.data;
        } catch (error) {
            const errorMessage = error.response ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.message) : error.message;
            throw new Error(errorMessage);
        }
    }

    async loginRequest(username, password) {
        const payload = `username=${username}&password=${password}&app_reg_id=${OrderKuota.APP_REG_ID}&app_version_code=${OrderKuota.APP_VERSION_CODE}&app_version_name=${OrderKuota.APP_VERSION_NAME}`;
        const headers = { 'Host': OrderKuota.HOST, 'User-Agent': OrderKuota.USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' };
        try {
            const response = await axios.post(`${OrderKuota.API_URL}/login`, payload, { headers });
            if (typeof response.data !== 'object') throw new Error(response.data);
            return response.data;
        } catch (error) {
            const errorMessage = error.response ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.message) : error.message;
            throw new Error(errorMessage);
        }
    }

    getAuthToken(username, otp) { return this.loginRequest(username, otp); }
    getAccountInfo() { return this.#requestLegacy('account'); }
    getTransactionHistory() { return this.#requestLegacy('qris_history'); }

    async getMutasi() {
        try {
            if (!this.#authToken || !this.#username) throw new Error("AuthToken and Username must be set.");
            const id = this.#authToken.split(':')[0];
            const url = `https://app.orderkuota.com/api/v2/qris/mutasi/${id}`;
            const timestamp = String(Date.now());

            const headers = {
                "Host": "app.orderkuota.com",
                "timestamp": timestamp,
                "content-type": "application/x-www-form-urlencoded",
                "accept-encoding": "gzip",
                "user-agent": "okhttp/4.12.0"
            };

            const data = new URLSearchParams({
                "app_version_name": "26.02.04",
                "app_version_code": "260204",
                "app_reg_id": "di309HvATsaiCppl5eDpoc:APA91bFUcTOH8h2XHdPRz2qQ5Bezn-3_TaycFcJ5pNLGWpmaxheQP9Ri0E56wLHz0_b1vcss55jbRQXZgc9loSfBdNa5nZJZVMlk7GS1JDMGyFUVvpcwXbMDg8tjKGZAurCGR4kDMDRJ",
                "phone_uuid": "di309HvATsaiCppl5eDpoc",
                "phone_model": "",
                "requests[qris_history][keterangan]": "",
                "requests[qris_history][jumlah]": "",
                "request_time": timestamp,
                "phone_android_version": "",
                "auth_username": this.#username,
                "requests[qris_history][page]": "1",
                "auth_token": this.#authToken,
                "ui_mode": "light",
                "requests[qris_history][dari_tanggal]": "",
                "requests[0]": "account",
                "requests[qris_history][ke_tanggal]": ""
            });

            const res = await axios.post(url, data, {
                headers, httpsAgent: agent
            });

            return { status: true, data: res.data.qris_history?.results || [] };
        } catch (err) {
            console.error("Error:", err.message);
            throw new Error(err.message);
        }
    }

    createQrisAjaib(amount) {
        const payload = { 'requests[qris_ajaib][amount]': amount };
        return this.#requestModern(payload);
    }

    checkQrisAjaibStatus(filters = {}) {
        const defaultFilters = { 'dari_tanggal': '', 'page': '1', 'ke_tanggal': '', 'keterangan': '', 'jumlah': '' };
        const finalFilters = { ...defaultFilters, ...filters };
        const payload = {};
        for (const key in finalFilters) {
            payload[`requests[qris_ajaib_history][${key}]`] = finalFilters[key];
        }
        return this.#requestModern(payload);
    }

    async checkElectricityBill(customerId) {
        if (!this.#authToken || !this.#username) throw new Error("AuthToken and Username must be set.");

        const inquiryPayload = new URLSearchParams({
            id_plgn: customerId,
            voucher_id: '2121',
            payment: 'balance',
            quantity: '1',
            pin: '',
            kode_promo: '',
            phone: '',
            auth_username: this.#username,
            auth_token: this.#authToken,
            ...this.#deviceParams,
            app_reg_id: OrderKuota.APP_REG_ID,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            app_version_name: OrderKuota.APP_VERSION_NAME
        }).toString();

        const headers = { 'Host': OrderKuota.HOST, 'User-Agent': OrderKuota.USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' };

        let transactionId;
        try {
            const inquiryResponse = await axios.post(`${OrderKuota.API_URL}/order`, inquiryPayload, { headers });
            transactionId = inquiryResponse.data?.results?.id;
            if (!transactionId) {
                return inquiryResponse.data;
            }
        } catch (error) {
            const errorMessage = error.response ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.message) : error.message;
            throw new Error(`Inquiry request failed: ${errorMessage}`);
        }

        const detailsPayload = {
            'requests[transaction_details][id]': transactionId,
            'requests[transaction_details][is_inquiry_check]': '1'
        };

        const maxRetries = 5;
        const retryDelay = 2000;
        let lastResponse;

        for (let i = 0; i < maxRetries; i++) {
            const detailsResponse = await this.#requestModern(detailsPayload);
            lastResponse = detailsResponse;
            const status = detailsResponse?.transaction_details?.results?.status;

            if (status === 'OK') {
                return detailsResponse;
            }

            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        return lastResponse;
    }

    async execute(action, params = {}) {
        const publicApiClient = new OrderKuota('defac', '2476730:C1nBJfojRgvWZQHY6EcG7zPMldxTrLy8');

        switch (action) {
            case 'request_otp':
                return await this.loginRequest(params.username || this.#username, params.password);
            case 'verify_otp':
                return await this.getAuthToken(params.username || this.#username, params.otp);
            case 'get_account_info':
                return await this.getAccountInfo();
            case 'get_history':
                return await this.getTransactionHistory();
            case 'get_mutasi':
                return await this.getMutasi();
            case 'check_electricity_bill': {
                if (!params.customer_id) throw new Error("Parameter 'customer_id' is required.");
                return await publicApiClient.checkElectricityBill(params.customer_id);
            }
            case 'check_qris_ajaib_status': {
                const filters = {};
                if (params.trxid) filters.keterangan = params.trxid;
                if (params.page) filters.page = params.page;
                if (params.dari_tanggal) filters.dari_tanggal = params.dari_tanggal;
                if (params.ke_tanggal) filters.ke_tanggal = params.ke_tanggal;
                if (params.jumlah) filters.jumlah = params.jumlah;
                return await this.checkQrisAjaibStatus(filters);
            }
            case 'buat_qris_ajaib': {
                if (!params.amount) throw new Error("Parameter 'amount' is required.");
                const response = await this.createQrisAjaib(params.amount);
                const qrCodeString = response?.qris_ajaib?.results?.code;
                if (qrCodeString) {
                    const qrCodeDataUrl = await qrcode.toDataURL(qrCodeString);
                    return { ...response, qr_image_data_url: qrCodeDataUrl };
                }
                return response;
            }
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

module.exports = OrderKuota;
