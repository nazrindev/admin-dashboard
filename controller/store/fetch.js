const Store = require('../../model/store');

const getStore = async (req, res) => {
  try {
    // Accept location from query or body safely with null checks
    const longitude = (req.query && req.query.longitude) || (req.body && req.body.longitude);
    const latitude = (req.query && req.query.latitude) || (req.body && req.body.latitude);

    let stores;
    if (longitude && latitude) {
      // Use aggregation to get distance in meters
      stores = await Store.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            distanceField: 'distance',
            spherical: true
          }
        }
      ]);
    } else {
      stores = await Store.find(); // Returns all fields including new ones
    }
    res.status(200).json({ message: 'Stores fetched successfully', stores });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stores', error: error.message });
  }
};

module.exports = { getStore }; 