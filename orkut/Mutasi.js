const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class OrderKuotaMutasi {
    #username;
    #authToken;
    #proxy;

    constructor(username, authToken, proxy = 'http://ip.atlantic-server.com:64433') {
        this.#username = username;
        this.#authToken = authToken;
        this.#proxy = proxy;
    }

    async fetchMutasi() {
        try {
            const agent = new HttpsProxyAgent(this.#proxy);
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
                "app_version_name": "25.03.14",
                "app_version_code": "250314",
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
                headers,
                httpsAgent: agent
            });

            return { status: true, data: res.data.qris_history?.results || [] };
        } catch (err) {
            console.error("Error Fetching Mutasi:", err.message);
            return { status: false, error: err.message };
        }
    }
}

module.exports = OrderKuotaMutasi;
