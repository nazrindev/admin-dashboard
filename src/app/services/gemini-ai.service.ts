import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { ProductInfo } from './ai-form-fill.service';

@Injectable({
  providedIn: 'root',
})
export class GeminiAiService {
  private geminiApiKey = environment.geminiApiKey;
  private geminiApiBaseUrl = `https://generativelanguage.googleapis.com/v1beta/models`;

  // Try different models in order of preference
  private models = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-pro-vision',
    'gemini-pro',
  ];

  constructor() {}

  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  async analyzeProductImage(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    if (
      !this.geminiApiKey ||
      this.geminiApiKey === 'your-gemini-api-key-here'
    ) {
      return {
        success: false,
        error: 'Gemini API key not configured',
      };
    }

    // First, try to get available models
    const availableModels = await this.listAvailableModels();
    console.log('📋 Available Gemini models:', availableModels);

    // Filter our preferred models to only include available ones
    const modelsToTry = this.models.filter((model) =>
      availableModels.some((available) => available === `models/${model}`)
    );

    if (modelsToTry.length === 0) {
      console.log('⚠️ No preferred models available, trying all models anyway');
      modelsToTry.push(...this.models);
    }

    // Try each model until one works
    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Trying Gemini model: ${model}`);
        const result = await this.tryModel(model, imageFile);
        if (result.success) {
          console.log(`✅ Gemini model ${model} worked!`);
          return result;
        }
        console.log(`❌ Gemini model ${model} failed: ${result.error}`);
      } catch (error) {
        console.log(`❌ Gemini model ${model} error:`, error);
        continue;
      }
    }

    return {
      success: false,
      error:
        'All Gemini models failed. Please try again or use manual form filling.',
    };
  }

  private async tryModel(
    model: string,
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    const apiUrl = `${this.geminiApiBaseUrl}/${model}:generateContent?key=${this.geminiApiKey}`;
    const base64Image = await this.fileToBase64(imageFile);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this product image carefully and extract ALL possible information. Return ONLY a valid JSON object with these exact fields:

{
  "productName": "Specific product name (e.g., 'Nike Air Max 270', 'Cotton T-Shirt', 'Leather Handbag')",
  "description": "Detailed 2-3 sentence description of the product, its features, and use case",
  "category": "Exact category from: Clothing, Shoes, Accessories, Electronics, Home, Beauty, Sports, Books, Toys, Food, Health, Automotive, Garden, Office",
  "brand": "Brand name if visible (e.g., Nike, Apple, Samsung, Zara, etc.)",
  "color": "Primary color(s) separated by commas (e.g., 'Black', 'Red, White', 'Blue')",
  "size": "Size information if visible (e.g., 'Medium', 'Large', '10', 'XL')",
  "material": "Material/fabric type (e.g., 'Cotton', 'Leather', 'Plastic', 'Metal', 'Silk')",
  "gender": "Target gender: 'Men', 'Women', or 'Unisex'",
  "occasion": "Best use occasion: 'Casual', 'Formal', 'Sports', 'Party', 'Work', 'Everyday'",
  "tags": "5-8 relevant tags separated by commas (e.g., 'comfortable, stylish, durable, trendy, versatile')"
}

IMPORTANT RULES:
1. Return ONLY the JSON object, no other text
2. If you can't see information clearly, make educated guesses based on visual cues
3. For productName, be specific and descriptive
4. For description, write 2-3 sentences about what the product is and its key features
5. For category, choose the most specific category from the list above
6. For tags, include descriptive words that would help customers find this product
7. Always provide values for all fields - never use null`,
              },
              {
                inline_data: {
                  mime_type: imageFile.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Check if it's a quota error
      if (
        errorData.error?.code === 429 ||
        errorData.error?.message?.includes('quota') ||
        errorData.error?.message?.includes('exceeded') ||
        errorData.error?.status === 'RESOURCE_EXHAUSTED'
      ) {
        throw new Error('QUOTA_EXCEEDED');
      }

      throw new Error(
        `Gemini API error: ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content received from Gemini');
    }

    try {
      const jsonText = this.extractJsonFromText(content) || content;
      const productInfo = JSON.parse(jsonText);
      return { success: true, data: productInfo };
    } catch (parseError) {
      // If JSON parsing fails, try to extract information from text
      const extractedInfo = this.extractInfoFromText(content);
      return { success: true, data: extractedInfo };
    }
  }

  async analyzeProductImageFromUrl(
    imageUrl: string
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    try {
      // Fetch the image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      return await this.analyzeProductImage(file);
    } catch (error) {
      console.error('Error analyzing image from URL:', error);
      return {
        success: false,
        error: `Failed to analyze image from URL: ${error}`,
      };
    }
  }

  private extractInfoFromText(text: string): ProductInfo {
    const info: ProductInfo = {};

    // Simple text extraction patterns
    const patterns = {
      productName: /product[:\s]+([^,\n]+)/i,
      description: /description[:\s]+([^,\n]+)/i,
      category: /category[:\s]+([^,\n]+)/i,
      brand: /brand[:\s]+([^,\n]+)/i,
      color: /color[:\s]+([^,\n]+)/i,
      size: /size[:\s]+([^,\n]+)/i,
      material: /material[:\s]+([^,\n]+)/i,
      gender: /gender[:\s]+([^,\n]+)/i,
      occasion: /occasion[:\s]+([^,\n]+)/i,
      tags: /tags[:\s]+([^,\n]+)/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        (info as any)[key] = match[1].trim();
      }
    }

    return info;
  }

  private extractJsonFromText(text: string): string | null {
    if (!text) return null;
    // Try fenced code block first
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      return fenced[1].trim();
    }
    // Fallback: find first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1).trim();
    }
    return null;
  }

  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image size must be less than 10MB' };
    }

    return { valid: true };
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
