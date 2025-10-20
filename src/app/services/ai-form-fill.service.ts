import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { LocalAiFallbackService } from './local-ai-fallback.service';
import { GeminiAiService } from './gemini-ai.service';

export interface ProductInfo {
  productName?: string;
  description?: string;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  gender?: string;
  occasion?: string;
  tags?: string;
  price?: number;
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

  async analyzeProductImage(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    // Try Gemini first (free and reliable)
    try {
      console.log('🤖 Trying Gemini AI analysis...');
      const geminiResult = await this.geminiAi.analyzeProductImage(imageFile);
      if (geminiResult.success) {
        console.log('✅ Gemini AI analysis successful');
        return geminiResult;
      }
      console.log('❌ Gemini AI failed, trying OpenAI...');
    } catch (error: any) {
      if (
        error.message === 'QUOTA_EXCEEDED' ||
        error.message?.includes('quota') ||
        error.message?.includes('429') ||
        error.message?.includes('exceeded')
      ) {
        console.log(
          '⚠️ Gemini quota exceeded, skipping Gemini and trying OpenAI...'
        );
      } else {
        console.log('❌ Gemini AI error:', error);
      }
    }

    // Try OpenAI as fallback
    try {
      console.log('🤖 Trying OpenAI analysis...');
      const openaiResult = await this.analyzeWithOpenAI(imageFile);
      if (openaiResult.success) {
        console.log('✅ OpenAI analysis successful');
        return openaiResult;
      }
      console.log('❌ OpenAI failed, trying local fallback...');
    } catch (error) {
      console.log('❌ OpenAI error:', error);
    }

    // Try local fallback as last resort
    try {
      console.log('🤖 Trying local fallback analysis...');
      const localResult = await this.localFallback.extractFromImageFallback(
        imageFile
      );
      if (localResult.success) {
        console.log('✅ Local fallback analysis successful');
        return localResult;
      }
    } catch (error) {
      console.log('❌ Local fallback error:', error);
    }

    return {
      success: false,
      error:
        'All AI analysis methods failed. Please try again or fill the form manually.',
    };
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

  private async analyzeWithOpenAI(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    if (
      !this.openaiApiKey ||
      this.openaiApiKey === 'your-openai-api-key-here'
    ) {
      throw new Error('OpenAI API key not configured');
    }

    const base64Image = await this.fileToBase64(imageFile);

    const response = await fetch(this.openaiApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
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
                type: 'image_url',
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
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
