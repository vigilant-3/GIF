import { getContext } from "../../extensions.js";
import { eventSource, event_types } from "../../../script.js";

const context = getContext();

function handleAvatarUpload(request, response, next) {
    const path = require('path');
    const fs = require('fs');
    const sanitize = require('sanitize-filename');
    const writeFileAtomicSync = require('write-file-atomic').sync;
    const { jsonParser, urlencodedParser } = require('../express-common');
    const { AVATAR_WIDTH, AVATAR_HEIGHT, UPLOADS_PATH } = require('../constants');
    const { getImages, tryParse } = require('../util');
    const jimp = require('jimp');

    if (!request.file) return response.sendStatus(400);

    try {
        const pathToUpload = path.join(UPLOADS_PATH, request.file.filename);
        const crop = tryParse(request.query.crop);
        const mimeType = request.file.mimetype;

        if (mimeType === 'image/gif') {
            // Handle GIF uploads
            const filename = request.body.overwrite_name || `${Date.now()}.gif`;
            const pathToNewFile = path.join(request.user.directories.avatars, filename);
            fs.renameSync(pathToUpload, pathToNewFile);
            return response.send({ path: filename });
        } else {
            // Handle other image uploads (PNG)
            let rawImg = await jimp.read(pathToUpload);

            if (typeof crop == 'object' && [crop.x, crop.y, crop.width, crop.height].every(x => typeof x === 'number')) {
                rawImg = rawImg.crop(crop.x, crop.y, crop.width, crop.height);
            }

            const image = await rawImg.cover(AVATAR_WIDTH, AVATAR_HEIGHT).getBufferAsync(jimp.MIME_PNG);

            const filename = request.body.overwrite_name || `${Date.now()}.png`;
            const pathToNewFile = path.join(request.user.directories.avatars, filename);
            writeFileAtomicSync(pathToNewFile, image);
            fs.rmSync(pathToUpload);
            return response.send({ path: filename });
        }
    } catch (err) {
        return response.status(400).send('Is not a valid image');
    }
}

function handleAvatarDisplay() {
    const avatars = document.querySelectorAll('.avatar img');
    avatars.forEach(avatar => {
        const src = avatar.getAttribute('src');
        if (src.endsWith('.gif')) {
            avatar.style.objectFit = 'cover';
        }
    });
}

function handleAcceptButton() {
    const acceptButton = document.querySelector('dialogue_popup_ok');
    acceptButton.addEventListener('click', () => {
        const avatarToCrop = document.querySelector('#avatarToCrop');
        const src = avatarToCrop.getAttribute('src');
        if (src.endsWith('.gif')) {
            // Ensure the GIF is not converted
            avatarToCrop.setAttribute('src', src); // Re-apply the src to ensure it's not converted
        }
    });
}

// Hook into the upload endpoint
eventSource.on(event_types.MESSAGE_RECEIVED, handleAvatarUpload);

// Hook into the avatar display
window.addEventListener('load', handleAvatarDisplay);
window.addEventListener('DOMNodeInserted', handleAvatarDisplay);
window.addEventListener('load', handleAcceptButton);

export { handleAvatarUpload, handleAvatarDisplay, handleAcceptButton };
