import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { LocalAiFallbackService } from './local-ai-fallback.service';
import { GeminiAiService } from './gemini-ai.service';

export interface ProductInfo {
  productName?: string;
  description?: string;
  category?: string;
  price?: number;
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  weight?: string;
  dimensions?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiFormFillService {
  private openaiApiKey = environment.openaiApiKey;
  private openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private localFallback: LocalAiFallbackService,
    private geminiAi: GeminiAiService
  ) {}

  /**
   * Analyze product image and extract product information
   * Uses intelligent fallback: Gemini -> OpenAI -> Local filename analysis
   * @param imageFile - The uploaded image file
   * @returns Promise with extracted product information
   */
  async analyzeProductImage(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    // Validate image file first
    const validation = this.validateImageFile(imageFile);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid image file',
      };
    }

    // Try Gemini first (often more generous free tier)
    console.log('🔮 Trying Gemini AI analysis...');
    const geminiResult = await this.geminiAi.analyzeProductImage(imageFile);
    if (geminiResult.success) {
      return geminiResult;
    }
    console.log('Gemini failed, trying OpenAI...', geminiResult.error);

    // Fallback to OpenAI
    const openaiResult = await this.analyzeWithOpenAI(imageFile);
    if (openaiResult.success) {
      return openaiResult;
    }
    console.log('OpenAI failed, trying local fallback...', openaiResult.error);

    // Final fallback to local filename analysis
    const fallbackResult = await this.localFallback.extractFromImageFallback(
      imageFile
    );
    if (fallbackResult.success) {
      return {
        success: true,
        data: fallbackResult.data,
      };
    }

    // All methods failed
    return {
      success: false,
      error: `All AI methods failed. Last errors: Gemini: ${geminiResult.error}, OpenAI: ${openaiResult.error}, Local: ${fallbackResult.error}`,
    };
  }

  /**
   * Analyze with OpenAI (fallback method)
   */
  private async analyzeWithOpenAI(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    try {
      if (
        !this.openaiApiKey ||
        this.openaiApiKey === 'YOUR_NEW_OPENAI_API_KEY_HERE'
      ) {
        throw new Error('OpenAI API key not configured');
      }

      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);

      const payload = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert product analyst that extracts comprehensive information from product images. 
            Analyze the image carefully and return ONLY a valid JSON object with the following fields (use null for missing information):
            {
              "productName": "string (clear, descriptive product name based on what you see)",
              "description": "string (detailed 2-3 sentence product description highlighting key features)",
              "category": "string (specific category: Electronics, Clothing, Shoes, Accessories, Food, Books, Home, Beauty, Sports, etc.)",
              "price": "number (extract price if visible on labels, tags, or packaging)",
              "brand": "string (brand name if visible on product, logo, or packaging)",
              "color": "string (primary color or dominant colors, comma-separated)",
              "size": "string (size information: clothing sizes S/M/L, shoe sizes, dimensions, etc.)",
              "material": "string (material composition if identifiable: cotton, leather, plastic, metal, etc.)",
              "weight": "string (weight if visible on packaging or labels)",
              "dimensions": "string (dimensions if visible or can be estimated from packaging)"
            }
            
            Important: Analyze all visible text, labels, packaging, and visual elements. Be specific and accurate.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and extract all available product information:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      };

      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;

        // Handle specific error types
        if (errorData.error?.code === 'insufficient_quota') {
          throw new Error('OpenAI quota exceeded.');
        } else if (errorData.error?.code === 'invalid_api_key') {
          throw new Error('Invalid OpenAI API key.');
        } else {
          throw new Error(`OpenAI API error: ${errorMessage}`);
        }
      }

      const result = await response.json();
      const extractedText = result.choices[0]?.message?.content;

      if (!extractedText) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON response
      const productInfo: ProductInfo = JSON.parse(extractedText);

      return {
        success: true,
        data: productInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OpenAI error',
      };
    }
  }

  /**
   * Use local fallback analysis (when OpenAI is not available)
   * @param imageFile - The uploaded image file
   * @returns Promise with extracted product information from filename
   */
  async analyzeProductImageFallback(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    return await this.localFallback.extractFromImageFallback(imageFile);
  }

  /**
   * Manually trigger Gemini analysis
   */
  async analyzeWithGemini(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    return await this.geminiAi.analyzeProductImage(imageFile);
  }

  /**
   * Fetches an image from a URL and analyzes it
   * @param imageUrl - The URL of the image to analyze
   * @returns Promise with extracted product information
   */
  async analyzeProductImageFromUrl(
    imageUrl: string
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    try {
      // Fetch the image and convert to File object
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }
      const blob = await response.blob();

      // Make sure we have a valid image blob
      if (!blob.type.startsWith('image/')) {
        throw new Error(
          `Invalid content type: ${blob.type}. URL must point to an image.`
        );
      }

      const filename =
        imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || 'image.jpg';
      const imageFile = new File([blob], filename, { type: blob.type });

      // Now call the existing analyzeProductImage with the file
      return this.analyzeProductImage(imageFile);
    } catch (error) {
      console.error('Error fetching image from URL:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? `Failed to process image URL: ${error.message}`
            : 'Unknown error occurred',
      };
    }
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Please upload a valid image file (JPEG, PNG, WebP)',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Image file size should be less than 5MB',
      };
    }

    return { valid: true };
  }
}
