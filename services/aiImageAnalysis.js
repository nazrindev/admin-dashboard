const vision = require("@google-cloud/vision");
const OpenAI = require("openai");

// Initialize Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to your service account key
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract business information from image using Google Cloud Vision API
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Object} - Extracted business information
 */
async function extractBusinessInfoWithVision(imageBuffer) {
  try {
    // Detect text in the image
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer },
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new Error("No text detected in image");
    }

    const extractedText = detections[0].description;

    // Use OpenAI to parse the extracted text into structured data
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts business information from text found in business images (store fronts, signs, business cards, etc.). 
          Parse the provided text and return ONLY a JSON object with the following fields (use null for missing information):
          {
            "businessName": "string",
            "address": "string", 
            "phone": "string",
            "website": "string",
            "description": "string",
            "type": "string (e.g., restaurant, retail, service)",
            "openTime": "string (HH:MM format)",
            "closeTime": "string (HH:MM format)"
          }`,
        },
        {
          role: "user",
          content: `Extract business information from this text: ${extractedText}`,
        },
      ],
      temperature: 0.1,
    });

    const businessInfo = JSON.parse(completion.choices[0].message.content);
    return {
      success: true,
      data: businessInfo,
      extractedText: extractedText,
    };
  } catch (error) {
    console.error("Error extracting business info with Vision API:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract business information from image using OpenAI GPT-4 Vision
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Object} - Extracted business information
 */
async function extractBusinessInfoWithGPTVision(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString("base64");

    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts business information from images of storefronts, business signs, business cards, or any business-related images. 
          Analyze the image and return ONLY a JSON object with the following fields (use null for missing information):
          {
            "businessName": "string",
            "address": "string", 
            "phone": "string",
            "website": "string",
            "description": "string (brief description of what the business does)",
            "type": "string (e.g., restaurant, retail, cafe, service, etc.)",
            "openTime": "string (HH:MM format if visible)",
            "closeTime": "string (HH:MM format if visible)"
          }`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all business information you can see from this image:",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const businessInfo = JSON.parse(completion.choices[0].message.content);
    return {
      success: true,
      data: businessInfo,
    };
  } catch (error) {
    console.error("Error extracting business info with GPT Vision:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main function to extract business information from image
 * Uses GPT Vision by default, falls back to Google Vision + GPT if needed
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} method - 'gpt-vision' or 'google-vision'
 * @returns {Object} - Extracted business information
 */
async function extractBusinessInfo(imageBuffer, method = "gpt-vision") {
  try {
    let result;

    if (method === "google-vision") {
      result = await extractBusinessInfoWithVision(imageBuffer);
    } else {
      result = await extractBusinessInfoWithGPTVision(imageBuffer);
    }

    // If first method fails, try the other
    if (!result.success && method === "gpt-vision") {
      console.log("GPT Vision failed, trying Google Vision...");
      result = await extractBusinessInfoWithVision(imageBuffer);
    }

    return result;
  } catch (error) {
    console.error("Error in extractBusinessInfo:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  extractBusinessInfo,
  extractBusinessInfoWithVision,
  extractBusinessInfoWithGPTVision,
};
