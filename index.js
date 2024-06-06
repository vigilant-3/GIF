import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import jimp from 'jimp';

const extensionName = "gif-avatar-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
}

async function cropGif(pathToUpload, crop) {
    const rawImg = await jimp.read(pathToUpload);
    if (typeof crop === 'object' && [crop.x, crop.y, crop.width, crop.height].every(x => typeof x === 'number')) {
        rawImg.crop(crop.x, crop.y, crop.width, crop.height);
    }
    return rawImg;
}

async function uploadAvatar(request, response) {
    if (!request.file) return response.sendStatus(400);

    try {
        const pathToUpload = path.join(UPLOADS_PATH, request.file.filename);
        const crop = tryParse(request.query.crop);
        const croppedImg = await cropGif(pathToUpload, crop);
        const filename = request.body.overwrite_name || `${Date.now()}.gif`;
        const pathToNewFile = path.join(request.user.directories.avatars, filename);
        writeFileAtomicSync(pathToNewFile, await croppedImg.getBufferAsync(jimp.MIME_GIF));
        fs.rmSync(pathToUpload);
        return response.send({ path: filename });
    } catch (err) {
        return response.status(400).send('Is not a valid image');
    }
}

jQuery(async () => {
    loadSettings();
});

export { uploadAvatar };
