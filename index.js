
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// Define the extension name and folder path
const extensionName = "gif-avatar-handler";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Updating settings in the UI
    $("#gif_avatar_setting").prop("checked", extension_settings[extensionName].gif_avatar_setting).trigger("input");
}

// This function is called when the extension settings are changed in the UI
function onGifAvatarInput(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].gif_avatar_setting = value;
    saveSettingsDebounced();
}

// Function to handle GIF cropping and uploading
async function handleGifUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/upload/avatar', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to upload avatar');
    }

    const result = await response.json();
    return result.path;
}

// This function is called when the extension is loaded
jQuery(async () => {
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

    // Append settingsHtml to extensions_settings
    $("#extensions_settings").append(settingsHtml);

    // Event listeners for settings and upload
    $("#gif_avatar_setting").on("input", onGifAvatarInput);

    $('#upload-avatar').on('change', async (event) => {
        const file = event.target.files[0];
        if (file.type === 'image/gif') {
            try {
                const path = await handleGifUpload(file);
                toastr.success('GIF Avatar uploaded successfully!');
            } catch (error) {
                toastr.error('Failed to upload GIF Avatar');
            }
        } else {
            toastr.error('Please upload a GIF file');
        }
    });

    // Load settings when starting things up
    loadSettings();
});
