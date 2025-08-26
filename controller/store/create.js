const Store = require('../../model/store');
const imagekit = require('../../utils/imagekit');
const fs = require('fs');

const createStore = async (req, res) => {
  try {
    const merchantId = '686fa458a4f0af450ce19eca'; // From JWT
    const { businessName, address, phone, logoUrl, website, description, location, type, rating, openTime, closeTime, supportDelivery, sameDayDelivery, verified } = req.body;

    let finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : 'https://ik.imagekit.io/bxrv0avsr/Placeholders/shop_placeholder.png';

    // If an image file is uploaded, upload it to ImageKit
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: req.file.filename,
        folder: '/stores',
      });
      finalLogoUrl = uploadResponse.url;
      // Optionally, delete the local file after upload
      fs.unlinkSync(req.file.path);
    }

    const store = new Store({
      merchantId,
      businessName,
      address, 
      phone,
      logoUrl: finalLogoUrl,
      website,
      description,
      type,
      rating: rating !== undefined ? rating : 0,
      openTime,
      closeTime,
      supportDelivery: supportDelivery !== undefined ? supportDelivery : false,
      sameDayDelivery: sameDayDelivery !== undefined ? sameDayDelivery : false,
      verified: verified !== undefined ? verified : false,
      location
    });

    if (location && location.coordinates) {
      store.location = {
        type: 'Point',
        coordinates: location.coordinates,
      };
    }
    

    await store.save();

    res.status(201).json({ message: 'Store profile created successfully', store });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create store', error: error.message });
  }
};

module.exports = { createStore };