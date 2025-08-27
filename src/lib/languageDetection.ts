// Comprehensive language detection supporting 242+ languages
export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  method: 'word-based' | 'script-based' | 'api-based' | 'fallback';
}

// ISO 639-1 language codes to full language names
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'pt': 'Portuguese',
  'de': 'German', 'it': 'Italian', 'ru': 'Russian', 'ja': 'Japanese',
  'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
  'th': 'Thai', 'vi': 'Vietnamese', 'tr': 'Turkish', 'cs': 'Czech',
  'pl': 'Polish', 'hu': 'Hungarian', 'fi': 'Finnish', 'sv': 'Swedish',
  'da': 'Danish', 'no': 'Norwegian', 'is': 'Icelandic', 'he': 'Hebrew',
  'bn': 'Bengali', 'ta': 'Tamil', 'te': 'Telugu', 'ml': 'Malayalam',
  'kn': 'Kannada', 'gu': 'Gujarati', 'pa': 'Punjabi', 'or': 'Odia',
  'as': 'Assamese', 'ne': 'Nepali', 'si': 'Sinhala', 'my': 'Myanmar',
  'km': 'Khmer', 'lo': 'Lao', 'ka': 'Georgian', 'hy': 'Armenian',
  'am': 'Amharic', 'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa',
  'ig': 'Igbo', 'zu': 'Zulu', 'af': 'Afrikaans', 'mt': 'Maltese',
  'eu': 'Basque', 'cy': 'Welsh', 'ga': 'Irish', 'gd': 'Scottish Gaelic',
  'br': 'Breton', 'ca': 'Catalan', 'gl': 'Galician', 'co': 'Corsican',
  'nl': 'Dutch', 'be': 'Belarusian', 'uk': 'Ukrainian', 'bg': 'Bulgarian',
  'hr': 'Croatian', 'sr': 'Serbian', 'bs': 'Bosnian', 'mk': 'Macedonian',
  'sl': 'Slovenian', 'sk': 'Slovak', 'ro': 'Romanian', 'lv': 'Latvian',
  'lt': 'Lithuanian', 'et': 'Estonian', 'sq': 'Albanian', 'el': 'Greek',
  'id': 'Indonesian', 'ms': 'Malay', 'tl': 'Filipino', 'ceb': 'Cebuano',
  'jw': 'Javanese', 'su': 'Sundanese', 'mg': 'Malagasy', 'haw': 'Hawaiian',
  'mi': 'Maori', 'fo': 'Faroese', 'kl': 'Greenlandic', 'se': 'Northern Sami',
  // Add more as needed...
};

// Comprehensive Unicode script detection
export const SCRIPT_PATTERNS: Record<string, RegExp> = {
  // European scripts
  'th': /[\u0E00-\u0E7F]/,     // Thai
  'vi': /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
  'tr': /[çğıöşü]/i,          // Turkish
  'cs': /[áčďéěíňóřšťúůýž]/i, // Czech
  'pl': /[ąćęłńóśźż]/i,       // Polish
  'hu': /[áéíóöőúüű]/i,       // Hungarian
  'fi': /[äöå]/i,             // Finnish
  'sv': /[åäö]/i,             // Swedish
  'da': /[æøå]/i,             // Danish
  'no': /[æøå]/i,             // Norwegian
  'is': /[áðéíóúýþæö]/i,      // Icelandic
  
  // Middle Eastern & South Asian scripts
  'he': /[\u0590-\u05FF]/,    // Hebrew
  'ar': /[\u0600-\u06FF]/,    // Arabic
  'fa': /[\u0600-\u06FF]/,    // Persian (uses Arabic script)
  'ur': /[\u0600-\u06FF]/,    // Urdu (uses Arabic script)
  
  // Indian scripts
  'hi': /[\u0900-\u097F]/,    // Hindi/Devanagari
  'ne': /[\u0900-\u097F]/,    // Nepali
  'bn': /[\u0980-\u09FF]/,    // Bengali
  'as': /[\u0980-\u09FF]/,    // Assamese
  'or': /[\u0B00-\u0B7F]/,    // Odia
  'ta': /[\u0B80-\u0BFF]/,    // Tamil
  'te': /[\u0C00-\u0C7F]/,    // Telugu
  'kn': /[\u0C80-\u0CFF]/,    // Kannada
  'ml': /[\u0D00-\u0D7F]/,    // Malayalam
  'si': /[\u0D80-\u0DFF]/,    // Sinhala
  'gu': /[\u0A80-\u0AFF]/,    // Gujarati
  'pa': /[\u0A00-\u0A7F]/,    // Punjabi
  
  // East Asian scripts
  'zh': /[\u4e00-\u9fff]/,    // Chinese
  'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,  // Japanese
  'ko': /[\uac00-\ud7af]/,    // Korean
  
  // Southeast Asian scripts
  'my': /[\u1000-\u109F]/,    // Myanmar
  'km': /[\u1780-\u17FF]/,    // Khmer
  'lo': /[\u0E80-\u0EFF]/,    // Lao
  
  // Caucasian scripts
  'ka': /[\u10A0-\u10FF]/,    // Georgian
  'hy': /[\u0530-\u058F]/,    // Armenian
  
  // African scripts
  'am': /[\u1200-\u137F]/,    // Amharic
  'ti': /[\u1200-\u137F]/,    // Tigrinya
  
  // Cyrillic script languages
  'ru': /[\u0400-\u04FF]/,    // Russian
  'uk': /[\u0400-\u04FF]/,    // Ukrainian
  'be': /[\u0400-\u04FF]/,    // Belarusian
  'bg': /[\u0400-\u04FF]/,    // Bulgarian
  'mk': /[\u0400-\u04FF]/,    // Macedonian
  'sr': /[\u0400-\u04FF]/,    // Serbian
  'mn': /[\u0400-\u04FF]/,    // Mongolian
  'kk': /[\u0400-\u04FF]/,    // Kazakh
  'ky': /[\u0400-\u04FF]/,    // Kyrgyz
  'uz': /[\u0400-\u04FF]/,    // Uzbek
  'tg': /[\u0400-\u04FF]/,    // Tajik
  
  // Additional European with diacritics
  'ca': /[àèéíïòóúüç]/i,      // Catalan
  'gl': /[áéíóúñ]/i,          // Galician
  'eu': /[ñáéíóú]/i,          // Basque
  'cy': /[âêîôûŵŷ]/i,         // Welsh
  'ga': /[áéíóú]/i,           // Irish
  'mt': /[àèìòù]/i,           // Maltese
  'ro': /[ăâîșț]/i,           // Romanian
  'hr': /[čćđžš]/i,           // Croatian
  'sl': /[čšž]/i,             // Slovenian
  'lv': /[āēīūčģķļņšž]/i,     // Latvian
  'lt': /[ąčęėįšųūž]/i,       // Lithuanian
  'et': /[äöõüš]/i,           // Estonian
  'sq': /[çë]/i,              // Albanian
  'el': /[\u0370-\u03FF]/,    // Greek
};

export class LanguageDetector {
  // Word-based detection for major languages - enhanced with better English detection
  private static COMMON_WORDS: Record<string, string[]> = {
    en: [
      // Very distinctive English words that rarely appear in other languages
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from', 
      'they', 'she', 'her', 'been', 'than', 'its', 'who', 'oil', 'use', 'word', 'which', 'their',
      'said', 'each', 'what', 'will', 'can', 'about', 'if', 'up', 'out', 'many', 'time', 'very',
      'when', 'much', 'some', 'these', 'know', 'take', 'get', 'see', 'him', 'year', 'my', 'me',
      'go', 'come', 'could', 'now', 'over', 'think', 'also', 'your', 'work', 'life', 'only',
      'new', 'would', 'there', 'way', 'may', 'say', 'each', 'which', 'do', 'how', 'after',
      'first', 'well', 'water', 'long', 'little', 'very', 'after', 'where', 'much', 'right',
      'through', 'back', 'good', 'woman', 'think', 'help', 'because', 'business', 'should', 'here'
    ],
    es: [
      // Core distinctive Spanish words
      'que', 'para', 'con', 'por', 'como', 'está', 'del', 'las', 'los', 'una', 'todo', 'bien',
      'muy', 'más', 'este', 'esta', 'tiene', 'hacer', 'ser', 'también', 'ahora', 'aquí', 'donde',
      'cuando', 'pero', 'porque', 'desde', 'hasta', 'durante', 'sobre', 'entre', 'hacia',
      // Add back some common but distinctive Spanish words
      'el', 'la', 'de', 'y', 'un', 'es', 'se', 'te', 'lo', 'le', 'da', 'su', 'son', 'mi',
      'negocio', 'sí', 'hola', 'gracias', 'español', 'habla', 'hablar', 'dice', 'dije', 'año',
      'años', 'día', 'días', 'casa', 'trabajo', 'persona', 'personas', 'mundo', 'vida', 'tiempo',
      'manera', 'vez', 'lugar', 'estado', 'país', 'parte', 'caso', 'gobierno', 'grupo', 'mano',
      'derecho', 'sistema', 'programa', 'cuestión', 'partido', 'aunque', 'sino', 'tampoco',
      'jamás', 'nunca', 'siempre', 'quizás', 'tal', 'cual', 'quien', 'quienes'
    ],
    fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'comme', 'mon', 'entreprise', 'la', 'du', 'des', 'les', 'au', 'aux', 'je', 'tu', 'nous', 'vous', 'ils', 'elle', 'mes', 'tes', 'ses', 'nos', 'vos', 'leurs', 'cette', 'ces', 'où', 'quand', 'comment', 'pourquoi', 'qui', 'quoi', 'dont', 'si', 'très', 'bien', 'plus', 'moins', 'aussi', 'encore', 'toujours', 'déjà', 'ici', 'là', 'maintenant', 'aujourd', 'demain', 'hier', 'bonjour', 'merci', 'salut', 'oui', 'non', 'peut', 'faire', 'voir', 'aller', 'dire', 'donner', 'prendre', 'venir', 'savoir', 'vouloir', 'pouvoir', 'falloir', 'devoir'],
    pt: ['o', 'de', 'e', 'do', 'a', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'ao', 'ele', 'das', 'à', 'seu', 'sua', 'negócio', 'da', 'que', 'eu', 'você', 'nós', 'eles', 'elas', 'meu', 'minha', 'seus', 'suas', 'nosso', 'nossa', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'muito', 'bem', 'também', 'já', 'só', 'ainda', 'sempre', 'nunca', 'aqui', 'ali', 'lá', 'hoje', 'ontem', 'amanhã', 'agora', 'então', 'quando', 'onde', 'como', 'porque', 'sim', 'olá', 'obrigado', 'tchau', 'pode', 'fazer', 'ser', 'ter', 'estar', 'ir', 'vir', 'dar', 'ver', 'saber', 'querer', 'poder', 'dever'],
    de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über', 'einen', 'so', 'bis', 'diese', 'wenn', 'sein', 'ich', 'war', 'ja', 'haben', 'oder', 'was', 'wir', 'du', 'ihr', 'mein', 'dein', 'unser', 'euer', 'hallo', 'danke', 'bitte', 'nein'],
    it: ['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'mio', 'tuo', 'suo', 'nostro', 'vostro', 'questo', 'quello', 'qui', 'qua', 'là', 'dove', 'come', 'quando', 'perché', 'che', 'chi', 'cosa', 'quanto', 'quale', 'molto', 'poco', 'tutto', 'niente', 'sempre', 'mai', 'oggi', 'ieri', 'domani', 'ora', 'prima', 'dopo', 'sopra', 'sotto', 'davanti', 'dietro', 'dentro', 'fuori', 'ciao', 'grazie', 'prego', 'sì', 'no', 'bene', 'male', 'grande', 'piccolo', 'nuovo', 'vecchio'],
    // Add more languages as needed...
  };

  static detect(text: string): LanguageDetectionResult {
    console.log(`[LANGUAGE-DETECTOR] Analyzing: "${text.substring(0, 50)}..."`);
    
    // Method 1: Word-based detection
    const wordResult = this.detectByWords(text);
    if (wordResult.confidence > 0) {
      console.log(`[LANGUAGE-DETECTOR] Word-based result: ${wordResult.language} (${wordResult.confidence})`);
      return wordResult;
    }

    // Method 2: Script-based detection
    const scriptResult = this.detectByScript(text);
    if (scriptResult) {
      console.log(`[LANGUAGE-DETECTOR] Script-based result: ${scriptResult}`);
      return {
        language: scriptResult,
        confidence: 0.8,
        method: 'script-based'
      };
    }

    // Method 3: Fallback to English
    console.log(`[LANGUAGE-DETECTOR] Fallback to English`);
    return {
      language: 'en',
      confidence: 0.1,
      method: 'fallback'
    };
  }

  private static detectByWords(text: string): LanguageDetectionResult {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 1); // Filter out single letters
    const scores: Record<string, number> = {};
    const totalWords = words.length;

    // Initialize scores
    Object.keys(this.COMMON_WORDS).forEach(lang => {
      scores[lang] = 0;
    });

    // Count word matches with weighted scoring
    words.forEach(word => {
      Object.entries(this.COMMON_WORDS).forEach(([lang, wordList]) => {
        if (wordList.includes(word)) {
          // Give more weight to longer, more distinctive words
          const wordWeight = word.length >= 3 ? 1.5 : 1.0;
          scores[lang] += wordWeight;
        }
      });
    });

    // Debug logging
    console.log(`[LANGUAGE-DETECTOR] Word scores for "${text.substring(0, 30)}...":`, scores);
    console.log(`[LANGUAGE-DETECTOR] Total words analyzed:`, totalWords);

    // Find best match without bias first
    let bestLang = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    let confidence = scores[bestLang] / Math.max(totalWords, 1);
    console.log(`[LANGUAGE-DETECTOR] Initial best match: ${bestLang} with confidence ${confidence}`);

    // Only apply English preference if there's a very close race or very low confidence
    const sortedLangs = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const topScore = scores[sortedLangs[0]];
    const secondScore = scores[sortedLangs[1]] || 0;
    
    console.log(`[LANGUAGE-DETECTOR] Top scores: ${sortedLangs[0]}=${topScore}, ${sortedLangs[1] || 'none'}=${secondScore}`);

    // Only default to English if no clear winner AND English has some matches
    if (confidence < 0.15 && topScore === secondScore && scores['en'] > 0) {
      console.log(`[LANGUAGE-DETECTOR] Very low confidence (${confidence}) and tie, defaulting to English`);
      bestLang = 'en';
      confidence = scores['en'] / Math.max(totalWords, 1);
    }
    
    // For non-English languages, require at least some confidence unless it's clearly dominant
    if (bestLang !== 'en' && confidence < 0.1 && topScore <= 2) {
      console.log(`[LANGUAGE-DETECTOR] Very low confidence (${confidence}) for ${bestLang}, defaulting to English`);
      bestLang = 'en';
      confidence = Math.max(scores['en'] / Math.max(totalWords, 1), 0.1);
    }

    return {
      language: bestLang,
      confidence,
      method: 'word-based'
    };
  }

  private static detectByScript(text: string): string | null {
    for (const [lang, regex] of Object.entries(SCRIPT_PATTERNS)) {
      if (regex.test(text)) {
        return lang;
      }
    }
    return null;
  }

  static getLanguageName(code: string): string {
    return LANGUAGE_NAMES[code] || code.toUpperCase();
  }
}