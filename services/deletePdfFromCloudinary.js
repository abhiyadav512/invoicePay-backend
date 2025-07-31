const cloudinary = require('../config/cloudinary');

const deletePdfFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });

    // if (result.result === 'ok') {
    //   console.log(`PDF deleted successfully: ${publicId}`);
    // } else {
    //   console.warn(`PDF deletion result: ${result.result} for ${publicId}`);
    // }

    return result;
  } catch (error) {
    // console.error('Failed to delete PDF from Cloudinary:', error);
    // throw error;
  }
};

module.exports = {
  deletePdfFromCloudinary
};
