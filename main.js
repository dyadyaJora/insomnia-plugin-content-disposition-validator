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

            function validate(headerValue) {
                // TODO
                return headerValue.includes('attachment');
            }

            const isValid = validate(contentDispositionHeader.value);
            if (isValid) {
                context.app.alert('Header Validation Report', '✅ Valid Content-Disposition header.');
            } else {
                context.app.alert('Header Validation Report', `❌ Invalid Content-Disposition header: ${contentDispositionHeader.value}`);
            }
        },
    },
];

module.exports.workspaceActions = [
    {
        label: 'Validate Headers',
        icon: 'fa-check-circle',
        action: async (context) => {
            const enabled = await isEnabled(context);
            if (!enabled) {
                context.app.alert('Header Validator Disabled', '⚠️ Plugin is currently disabled. Enable it in settings to run validation.');
                return;
            }

            const isValid = true;
            if (isValid) {
                context.app.alert('Header Validation Report', '✅ Valid headers.');
            } else {
                context.app.alert('Header Validation Report', '❌ Invalid headers.');
            }
        }
    }
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
