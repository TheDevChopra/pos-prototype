import { MenuItem } from './store';

// Number mappings for English and Hindi
const NUMBER_MAP: Record<string, number> = {
  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  // Hindi
  'ek': 1, 'do': 2, 'teen': 3, 'chaar': 4, 'paanch': 5,
  'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
};

// Common menu keyword mapping for fuzzy matching
const KEYWORD_MAP: Record<string, string> = {
  'fries': 'Classic Fries',
  'finger': 'Classic Fries',
  'burger': 'Paneer Burger',
  'shake': 'Chocolate Shake',
  'mango': 'Mango Shake',
  'oreo': 'Oreo Shake',
  'kitkat': 'Kitkat Shake',
  'chai': 'Chai',
  'tea': 'Chai',
  'coffee': 'Hot Coffee',
  'sandwich': 'Veg Sandwich',
  'momo': 'Veg Momos',
  'maggi': 'Plain Maggi',
  'ice cream': 'Cone Ice Cream',
  'cold coffee': 'Cold Coffee',
};

export interface ParsedOrderItem {
  item: MenuItem;
  quantity: number;
}

export function parseVoiceTranscript(transcript: string, menuItems: MenuItem[]): { items: ParsedOrderItem[], unrecognized: string[] } {
  const result: ParsedOrderItem[] = [];
  const unrecognized: string[] = [];
  
  // Normalize transcript: lowercase and split by common separators
  const words = transcript.toLowerCase().replace(/,/g, '').split(/\s+/);
  
  let currentQuantity = 1;
  const processedWords = new Set<number>();

  for (let i = 0; i < words.length; i++) {
    if (processedWords.has(i)) continue;

    const word = words[i];

    // Check if word is a number (English/Hindi or Digit)
    if (NUMBER_MAP[word]) {
      currentQuantity = NUMBER_MAP[word];
      processedWords.add(i);
      continue;
    } 
    
    if (!isNaN(parseInt(word))) {
      currentQuantity = parseInt(word);
      processedWords.add(i);
      continue;
    }

    // Try to match a multi-word item or keyword
    let found = false;
    
    // Check for 2-word combinations (e.g., "mango shake", "cold coffee")
    if (i + 1 < words.length) {
      const twoWords = `${word} ${words[i+1]}`;
      const match = findBestMatch(twoWords, menuItems);
      if (match) {
        result.push({ item: match, quantity: currentQuantity });
        processedWords.add(i);
        processedWords.add(i + 1);
        currentQuantity = 1; // reset for next item
        found = true;
      }
    }

    // Check for single word
    if (!found) {
      const match = findBestMatch(word, menuItems);
      if (match) {
        result.push({ item: match, quantity: currentQuantity });
        processedWords.add(i);
        currentQuantity = 1;
        found = true;
      }
    }

    // If word is likely an item but not found (filter out connective words)
    const connectives = ['and', 'aur', 'plus', 'with', 'the', 'order', 'please'];
    if (!found && !connectives.includes(word) && word.length > 2) {
      unrecognized.push(word);
    }
  }

  return { items: result, unrecognized };
}

function findBestMatch(input: string, menuItems: MenuItem[]): MenuItem | null {
  // 1. Exact match
  const exact = menuItems.find(item => item.name.toLowerCase() === input);
  if (exact) return exact;

  // 2. Keyword map match
  const mappedName = KEYWORD_MAP[input];
  if (mappedName) {
    const match = menuItems.find(item => item.name.toLowerCase() === mappedName.toLowerCase());
    if (match) return match;
  }

  // 3. Partial inclusion (input is part of a menu item name)
  const partial = menuItems.find(item => item.name.toLowerCase().includes(input));
  if (partial) return partial;

  return null;
}
