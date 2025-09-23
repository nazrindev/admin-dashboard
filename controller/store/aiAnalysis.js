const { extractBusinessInfo } = require("../../services/aiImageAnalysis");
const fs = require("fs");

/**
 * Analyze uploaded image and extract business information using AI
 * This endpoint can be called before creating a store to auto-fill the form
 */
const analyzeStoreImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file uploaded. Please upload an image to analyze.",
      });
    }

    // Read the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);

    // Extract business information using AI
    const analysisResult = await extractBusinessInfo(
      fileBuffer,
      req.query.method || "gpt-vision"
    );

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    if (!analysisResult.success) {
      return res.status(500).json({
        message: "Failed to analyze image",
        error: analysisResult.error,
      });
    }

    // Return the extracted business information
    res.status(200).json({
      message: "Image analyzed successfully",
      extractedInfo: analysisResult.data,
      ...(analysisResult.extractedText && {
        extractedText: analysisResult.extractedText,
      }),
    });
  } catch (error) {
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Error in analyzeStoreImage:", error);
    res.status(500).json({
      message: "Failed to analyze image",
      error: error.message,
    });
  }
};

/**
 * Create store with AI-assisted form filling
 * This combines image analysis with store creation
 */
const createStoreWithAI = async (req, res) => {
  try {
    const merchantId = "686fa458a4f0af450ce19eca"; // This should come from JWT in production
    let extractedInfo = {};

    // If an image is uploaded, analyze it first
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);

      // Extract business information using AI
      const analysisResult = await extractBusinessInfo(
        fileBuffer,
        req.query.method || "gpt-vision"
      );

      if (analysisResult.success) {
        extractedInfo = analysisResult.data;
      }
    }

    // Merge AI-extracted data with user-provided data (user data takes precedence)
    const {
      businessName,
      address,
      phone,
      logoUrl,
      website,
      description,
      location,
      type,
      rating,
      openTime,
      closeTime,
      supportDelivery,
      sameDayDelivery,
      verified,
    } = req.body;

    // Use AI-extracted data as fallback for missing fields
    const finalData = {
      businessName: businessName || extractedInfo.businessName,
      address: address || extractedInfo.address,
      phone: phone || extractedInfo.phone,
      website: website || extractedInfo.website,
      description: description || extractedInfo.description,
      type: type || extractedInfo.type,
      openTime: openTime || extractedInfo.openTime,
      closeTime: closeTime || extractedInfo.closeTime,
      // These fields don't come from AI, use defaults
      rating: rating !== undefined ? rating : 0,
      supportDelivery: supportDelivery !== undefined ? supportDelivery : false,
      sameDayDelivery: sameDayDelivery !== undefined ? sameDayDelivery : false,
      verified: verified !== undefined ? verified : false,
      location,
    };

    // Handle logo upload (same as original logic)
    let finalLogoUrl =
      logoUrl && logoUrl.trim() !== ""
        ? logoUrl
        : "https://ik.imagekit.io/bxrv0avsr/Placeholders/shop_placeholder.png";

    if (req.file) {
      const imagekit = require("../../utils/imagekit");
      const fileBuffer = fs.readFileSync(req.file.path);
      const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: req.file.filename,
        folder: "/stores",
      });
      finalLogoUrl = uploadResponse.url;
      fs.unlinkSync(req.file.path);
    }

    // Create the store
    const Store = require("../../model/store");
    const store = new Store({
      merchantId,
      businessName: finalData.businessName,
      address: finalData.address,
      phone: finalData.phone,
      logoUrl: finalLogoUrl,
      website: finalData.website,
      description: finalData.description,
      type: finalData.type,
      rating: finalData.rating,
      openTime: finalData.openTime,
      closeTime: finalData.closeTime,
      supportDelivery: finalData.supportDelivery,
      sameDayDelivery: finalData.sameDayDelivery,
      verified: finalData.verified,
      location: finalData.location,
    });

    if (finalData.location && finalData.location.coordinates) {
      store.location = {
        type: "Point",
        coordinates: finalData.location.coordinates,
      };
    }

    await store.save();

    res.status(201).json({
      message: "Store created successfully with AI assistance",
      store,
      aiExtractedInfo: extractedInfo,
    });
  } catch (error) {
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Error in createStoreWithAI:", error);
    res.status(500).json({
      message: "Failed to create store",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeStoreImage,
  createStoreWithAI,
};
