import { Injectable } from '@angular/core';
import { ProductInfo } from './ai-form-fill.service';

@Injectable({
  providedIn: 'root',
})
export class LocalAiFallbackService {
  constructor() {}

  /**
   * Extract basic product information from image filename and metadata
   * This is a fallback when OpenAI is not available
   */
  async extractFromImageFallback(
    imageFile: File
  ): Promise<{ success: boolean; data?: ProductInfo; error?: string }> {
    try {
      const filename = imageFile.name.toLowerCase();
      const productInfo: ProductInfo = {};

      // Extract information from filename patterns
      productInfo.productName = this.extractProductNameFromFilename(filename);
      productInfo.color = this.extractColorFromFilename(filename);
      productInfo.category = this.extractCategoryFromFilename(filename);
      productInfo.brand = this.extractBrandFromFilename(filename);
      productInfo.size = this.extractSizeFromFilename(filename);

      // Generate a basic description
      if (productInfo.productName) {
        productInfo.description = `${productInfo.productName}${
          productInfo.color ? ` in ${productInfo.color}` : ''
        }${productInfo.brand ? ` by ${productInfo.brand}` : ''}`;
      }

      return {
        success: true,
        data: productInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to extract information from image filename',
      };
    }
  }

  private extractProductNameFromFilename(filename: string): string | undefined {
    // Remove file extension and common prefixes
    let name = filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
    name = name.replace(/^(img|image|photo|pic|product)[-_\s]*/i, '');

    // Replace common separators with spaces
    name = name.replace(/[-_]/g, ' ');

    // Remove numbers that might be SKUs or IDs
    name = name.replace(/\b\d{3,}\b/g, '');

    // Capitalize words
    name = name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();

    return name.length > 2 ? name : undefined;
  }

  private extractColorFromFilename(filename: string): string | undefined {
    const colors = [
      'red',
      'blue',
      'green',
      'black',
      'white',
      'gray',
      'grey',
      'yellow',
      'orange',
      'purple',
      'pink',
      'brown',
      'navy',
      'beige',
      'gold',
      'silver',
    ];

    for (const color of colors) {
      if (filename.includes(color)) {
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }
    return undefined;
  }

  private extractCategoryFromFilename(filename: string): string | undefined {
    const categories = [
      {
        keywords: ['shirt', 'tshirt', 't-shirt', 'blouse', 'top'],
        category: 'Clothing',
      },
      {
        keywords: ['pants', 'jeans', 'trousers', 'shorts'],
        category: 'Clothing',
      },
      { keywords: ['dress', 'skirt', 'gown'], category: 'Clothing' },
      { keywords: ['shoe', 'sneaker', 'boot', 'sandal'], category: 'Shoes' },
      { keywords: ['phone', 'mobile', 'smartphone'], category: 'Electronics' },
      { keywords: ['laptop', 'computer', 'tablet'], category: 'Electronics' },
      { keywords: ['watch', 'clock'], category: 'Accessories' },
      {
        keywords: ['bag', 'purse', 'backpack', 'wallet'],
        category: 'Accessories',
      },
      { keywords: ['book', 'novel', 'magazine'], category: 'Books' },
      { keywords: ['toy', 'game', 'doll'], category: 'Toys' },
    ];

    for (const cat of categories) {
      if (cat.keywords.some((keyword) => filename.includes(keyword))) {
        return cat.category;
      }
    }
    return undefined;
  }

  private extractBrandFromFilename(filename: string): string | undefined {
    const brands = [
      'nike',
      'adidas',
      'apple',
      'samsung',
      'sony',
      'canon',
      'gucci',
      'prada',
      'zara',
      'h&m',
      'uniqlo',
    ];

    for (const brand of brands) {
      if (filename.includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
    return undefined;
  }

  private extractSizeFromFilename(filename: string): string | undefined {
    // Look for clothing sizes
    const sizeMatch = filename.match(/\b(xs|s|m|l|xl|xxl|xxxl|\d+)\b/i);
    if (sizeMatch) {
      return sizeMatch[1].toUpperCase();
    }
    return undefined;
  }
}
