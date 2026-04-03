const apiActions = [
    {
        id: 'request_otp',
        title: 'Request OTP',
        params: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true }
        ]
    },
    {
        id: 'verify_otp',
        title: 'Verify OTP',
        params: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'otp', label: 'OTP Code', type: 'text', required: true }
        ]
    },
    {
        id: 'get_account_info',
        title: 'Get Account Info',
        params: []
    },
    // {
    //     id: 'get_history',
    //     title: 'Get History',
    //     params: []
    // },
    {
        id: 'get_mutasi',
        title: 'Get Mutasi History',
        params: []
    },
    {
        id: 'check_electricity_bill',
        title: 'Check Electricity Bill',
        params: [
            { name: 'customer_id', label: 'Customer ID (ID Pelanggan)', type: 'text', required: true }
        ]
    },
    {
        id: 'check_qris_ajaib_status',
        title: 'Check QRIS Ajaib Status',
        params: [
            { name: 'trxid', label: 'Transaction ID (Optional)', type: 'text', required: false },
            { name: 'page', label: 'Page', type: 'number', required: false, default: 1 },
            { name: 'dari_tanggal', label: 'From Date (Optional)', type: 'date', required: false },
            { name: 'ke_tanggal', label: 'To Date (Optional)', type: 'date', required: false },
            { name: 'jumlah', label: 'Amount (Optional)', type: 'number', required: false }
        ]
    },
    {
        id: 'buat_qris_ajaib',
        title: 'Create QRIS Ajaib',
        params: [
            { name: 'amount', label: 'Amount', type: 'number', required: true }
        ]
    }
];

let currentSelectedAction = apiActions[0];

// Initialize particles.js for background
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80 },
        "color": { "value": "#2ea043" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": false },
        "size": { "value": 3, "random": true },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#2ea043",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 2,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": { "enable": true, "mode": "grab" },
            "onclick": { "enable": true, "mode": "push" },
            "resize": true
        },
        "modes": {
            "grab": { "distance": 140, "line_linked": { "opacity": 1 } },
            "push": { "particles_nb": 4 }
        }
    },
    "retina_detect": true
});

document.addEventListener("DOMContentLoaded", () => {
    const actionListEl = document.getElementById('actionList');
    const dynamicInputsEl = document.getElementById('dynamicInputs');
    const titleEl = document.getElementById('currentActionTitle');
    const formEl = document.getElementById('apiForm');
    const jsonResponseEl = document.getElementById('jsonResponse');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const responseTimeEl = document.getElementById('responseTime');
    const copyJsonBtn = document.getElementById('copyJsonBtn');

    function renderActions() {
        actionListEl.innerHTML = '';
        apiActions.forEach(action => {
            const li = document.createElement('li');
            li.className = `list-group-item ${currentSelectedAction.id === action.id ? 'active' : ''}`;
            li.innerHTML = `${action.title} <span class="dot"></span>`;
            li.addEventListener('click', () => {
                currentSelectedAction = action;
                renderActions();
                renderParams();
            });
            actionListEl.appendChild(li);
        });
    }

    function renderParams() {
        titleEl.textContent = currentSelectedAction.title;
        dynamicInputsEl.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Auth Username (Optional, default bot account)</label>
                <input type="text" class="form-control" name="auth_username" placeholder="Leave empty for default">
            </div>
            <div class="mb-3">
                <label class="form-label">Auth Token (Optional, default bot account)</label>
                <input type="text" class="form-control" name="auth_token" placeholder="Leave empty for default">
            </div>
            <hr class="border-secondary mt-4 mb-4">
        `;

        if (currentSelectedAction.params.length === 0) {
            dynamicInputsEl.innerHTML += `<p class="text-secondary small fst-italic">No additional parameters required for this action.</p>`;
        }

        currentSelectedAction.params.forEach(param => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-3';
            wrapper.innerHTML = `
                <label class="form-label">${param.label} ${param.required ? '<span class="text-danger">*</span>' : ''}</label>
                <input type="${param.type}" class="form-control" name="${param.name}" placeholder="Enter ${param.label.toLowerCase()}" ${param.required ? 'required' : ''} ${param.default ? `value="${param.default}"` : ''}>
            `;
            dynamicInputsEl.appendChild(wrapper);
        });
    }

    renderActions();
    renderParams();

    // Form submission
    formEl.addEventListener('submit', async (e) => {
        e.preventDefault();

        loadingOverlay.classList.remove('d-none');
        loadingOverlay.classList.add('d-flex');

        const startTime = performance.now();
        const formData = new FormData(formEl);

        let reqBody = {
            action: currentSelectedAction.id,
            params: {}
        };

        formData.forEach((value, key) => {
            if (key === 'auth_username' && value.trim() !== '') {
                reqBody.username = value;
            } else if (key === 'auth_token' && value.trim() !== '') {
                reqBody.authToken = value;
            } else if (value.trim() !== '') {
                reqBody.params[key] = value;
            }
        });

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });

            const result = await response.json();

            jsonResponseEl.textContent = JSON.stringify(result, null, 2);
            Prism.highlightElement(jsonResponseEl);
        } catch (err) {
            jsonResponseEl.textContent = JSON.stringify({ error: err.message }, null, 2);
            Prism.highlightElement(jsonResponseEl);
        } finally {
            const endTime = performance.now();
            responseTimeEl.textContent = `${Math.round(endTime - startTime)}ms`;
            loadingOverlay.classList.remove('d-flex');
            loadingOverlay.classList.add('d-none');
        }
    });

    // Copy JSON Button
    copyJsonBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(jsonResponseEl.textContent);
        const originalText = copyJsonBtn.textContent;
        copyJsonBtn.textContent = 'Copied!';
        setTimeout(() => { copyJsonBtn.textContent = originalText; }, 2000);
    });
});
