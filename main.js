const { validate } = require('./contentDisposition');
const REQUIRED_HEADERS = ['Authorization', 'X-Custom-Header'];
const ENABLE_SETTING_KEY = 'enabled';

/**
 * Check if plugin is enabled via settings
 */
async function isEnabled(context) {
    const value = await context.store.getItem(ENABLE_SETTING_KEY);
    return value === true || value === 'true';
}


module.exports.requestActions = [
    {
        label: 'Validate Content-Disposition header data',
        action: async (context, data) => {
            const { request } = data;

            const contentDispositionHeader = request.headers.find(h => h.name.toLowerCase() === 'content-disposition');
            if (!contentDispositionHeader || contentDispositionHeader.disabled) {
                return context.app.alert('Header Validation Report', '⚠️ Missing Content-Disposition header.');
            }

            const { type, params } = validate(contentDispositionHeader.value);

            const paramsList = Object.entries(params).map(([key, { value, error }]) => {
                const emoji = error ? '🔴' : '🟢';
                return `<li>${emoji} <strong>${key}</strong>: ${value || 'N/A'}${error ? ` (Error: ${error})` : ''}</li>`;
            }).join('');

            const displayedList = type 
                ? `<li>🟢 <strong>Type</strong>: ${type}</li>${paramsList}` 
                : paramsList;

            const hasErrors = Object.values(params).some(param => param.error);

            const bodyElement = document.createElement('div');
            bodyElement.innerHTML = `
                <p>${hasErrors ? '❌ Invalid' : '✅ Valid'} Content-Disposition header: <strong>${contentDispositionHeader.value}</strong></p>
                <ul>${displayedList}</ul>
            `;

            context.app.dialog('Header Validation Report', bodyElement, { tall: false });
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
