const Store = require('../../model/store');

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, address, phone, logoUrl, website, description, location, type, rating, openTime, closeTime, supportDelivery, sameDayDelivery, verified } = req.body;

    // Use placeholder if logoUrl is empty or not provided
    const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : 'https://ik.imagekit.io/bxrv0avsr/Placeholders/shop_placeholder.png';

    const updateFields = {
      businessName,
      address,
      phone,
      logoUrl: finalLogoUrl,
      website,
      description,
      type,
      rating,
      openTime,
      closeTime,
      supportDelivery,
      sameDayDelivery,
      verified
    };

    if (location && location.coordinates) {
      updateFields.location = {
        type: 'Point',
        coordinates: location.coordinates,
      };
    }

    const store = await Store.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.status(200).json({ message: 'Store updated successfully', store });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store', error: error.message });
  }
};

module.exports = { updateStore }; 