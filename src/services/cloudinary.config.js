const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'baotran',
    api_key: '244762975537599',
    api_secret: 'DPxF2eyv3O-BOAVoWeIh1o9KJ8g'
});

module.exports = cloudinary