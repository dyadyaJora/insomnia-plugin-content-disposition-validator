const { validate } = require('./contentDisposition');
const REQUIRED_HEADERS = ['Authorization', 'X-Custom-Header'];
const ENABLE_SETTING_KEY = 'enabled';

/**
 * Check if plugin is enabled via settings
 */
async function isEnabled(context) {
    console.log("isEnabled");
    const value = await context.store.getItem(ENABLE_SETTING_KEY);
    return value === true || value === 'true';
}


module.exports.requestActions = [
    {
        label: 'Validate Content-Disposition header data',
        action: async (context, data) => {
            console.log("requestActions");
            const { request } = data;

            const contentDispositionHeader = request.headers.find(h => h.name.toLowerCase() === 'content-disposition');
            if (!contentDispositionHeader) {
                context.app.alert('Header Validation Report', '⚠️ Missing Content-Disposition header.');
                return;
            }

            const res = validate(contentDispositionHeader.value);
            console.log("res", res);

            const paramsList = Object.entries(res.params).map(([key, { value, error }]) => {
                const emoji = error ? '🔴' : '🟢';
                const errorText = error ? ` (Error: ${error})` : '';
                return `<li>${emoji} <strong>${key}</strong>: ${value || 'N/A'}${errorText}</li>`;
            }).join('');

            const hasErrors = Object.values(res.params).some(param => param.error);

            const bodyElement = document.createElement('div');
            if (hasErrors) {
                bodyElement.innerHTML = `
                    <p>❌ Invalid Content-Disposition header: <strong>${contentDispositionHeader.value}</strong></p>
                    <ul>${paramsList}</ul>
                `;
            } else {
                bodyElement.innerHTML = `
                    <p>✅ Valid Content-Disposition header: <strong>${contentDispositionHeader.value}</strong></p>
                    <ul>${paramsList}</ul>
                `;
            }

            context.app.dialog('Header Validation Report', bodyElement, {
                tall: false,
            });
        },
    },
];

module.exports.config = {
    name: 'Header Validator Settings',
    description: 'Toggle whether the header validator is active.',
    inputs: [
        {
            type: 'boolean',
            label: 'Enable Header Validation',
            key: ENABLE_SETTING_KEY,
            defaultValue: true
        }
    ]
};
