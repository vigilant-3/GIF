import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import Jimp from 'jimp';
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage } from 'canvas';

const extensionName = "sillytavern-gif-avatars";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

// Load settings function
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
}

// Handle avatar upload and crop
async function handleAvatarUpload(file, crop) {
    const image = await Jimp.read(file);
    if (crop) {
        image.crop(crop.x, crop.y, crop.width, crop.height);
    }
    const buffer = await image.getBufferAsync(Jimp.MIME_GIF); // Save as GIF
    return buffer;
}

// Add event listener for avatar upload
function onAvatarUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const crop = getCropSettings(); // Implement this function as needed
            const gifBuffer = await handleAvatarUpload(e.target.result, crop);
            // Handle displaying the GIF avatar
            displayGifAvatar(gifBuffer);
        };
        reader.readAsArrayBuffer(file);
    }
}

// Display the GIF avatar
function displayGifAvatar(gifBuffer) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(new Blob([gifBuffer], { type: 'image/gif' }));
    document.getElementById('avatar-container').appendChild(img);
}

// Initialize the extension
jQuery(async () => {
    // Load settings if needed
    await loadSettings();

    // Add event listener for avatar upload input
    document.getElementById('avatar-upload-input').addEventListener('change', onAvatarUpload);
});
