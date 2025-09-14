'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceChatProps {
  onTranscript: (transcript: string, replace?: boolean) => void;
  onAudioResponse?: string;
  continuous?: boolean;
  isDisabled?: boolean;
  currentText?: string;
  language?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceChat({ 
  onTranscript, 
  continuous = false, 
  isDisabled = false,
  currentText = '',
  language = 'auto'
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(() => {
    // Try to detect user's preferred language from browser
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language || navigator.languages?.[0] || 'en-US';
      console.log('[VOICE] Browser language detected:', browserLang);
      
      // Map common browser language codes to our supported voice languages
      const langMap: Record<string, string> = {
        // English variants
        'en': 'en-US', 'en-US': 'en-US', 'en-GB': 'en-GB', 'en-CA': 'en-CA', 
        'en-AU': 'en-AU', 'en-NZ': 'en-NZ', 'en-IN': 'en-IN', 'en-ZA': 'en-ZA',
        
        // Spanish variants  
        'es': 'es-ES', 'es-ES': 'es-ES', 'es-MX': 'es-MX', 'es-AR': 'es-AR',
        'es-CO': 'es-CO', 'es-CL': 'es-CL', 'es-US': 'es-US',
        
        // French variants
        'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'fr-CA': 'fr-CA', 'fr-BE': 'fr-BE', 'fr-CH': 'fr-CH',
        
        // German variants
        'de': 'de-DE', 'de-DE': 'de-DE', 'de-AT': 'de-AT', 'de-CH': 'de-CH',
        
        // Portuguese variants
        'pt': 'pt-BR', 'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT',
        
        // Italian variants
        'it': 'it-IT', 'it-IT': 'it-IT', 'it-CH': 'it-CH',
        
        // Other major languages
        'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'zh-HK': 'zh-HK',
        'ar': 'ar-SA', 'hi': 'hi-IN', 'ru': 'ru-RU', 'nl': 'nl-NL', 'sv': 'sv-SE', 
        'da': 'da-DK', 'no': 'no-NO', 'fi': 'fi-FI', 'pl': 'pl-PL', 'tr': 'tr-TR',
        'he': 'he-IL', 'th': 'th-TH', 'vi': 'vi-VN', 'id': 'id-ID', 'ms': 'ms-MY'
      };
      
      // Extract base language code (e.g., 'fr-FR' → 'fr')
      const baseCode = browserLang.split('-')[0];
      const fullCode = browserLang;
      
      return langMap[fullCode] || langMap[baseCode] || 'en-US';
    }
    return 'en-US';
  });
  const lastSentTextRef = useRef('');
  const processedResultsRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldKeepRecordingRef = useRef<boolean>(false);

  // Comprehensive language support - 242+ languages mapped to Web Speech API formats
  const getVoiceLanguage = (language: string) => {
    // Comprehensive mapping from LanguageDetector codes to Web Speech API language codes
    const languageMap: Record<string, string> = {
      'auto': 'en-US',
      
      // Major European languages
      'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'pt': 'pt-BR', 'de': 'de-DE',
      'it': 'it-IT', 'nl': 'nl-NL', 'ru': 'ru-RU', 'pl': 'pl-PL', 'tr': 'tr-TR',
      
      // Nordic languages
      'sv': 'sv-SE', 'no': 'no-NO', 'da': 'da-DK', 'fi': 'fi-FI', 'is': 'is-IS',
      'fo': 'fo-FO', 'kl': 'kl-GL', 'se': 'se-NO',
      
      // Eastern European
      'cs': 'cs-CZ', 'sk': 'sk-SK', 'hu': 'hu-HU', 'ro': 'ro-RO', 'bg': 'bg-BG',
      'hr': 'hr-HR', 'sl': 'sl-SI', 'et': 'et-EE', 'lv': 'lv-LV', 'lt': 'lt-LT',
      'mk': 'mk-MK', 'sq': 'sq-AL', 'sr': 'sr-RS', 'bs': 'bs-BA', 'uk': 'uk-UA', 'be': 'be-BY',
      
      // Celtic languages
      'ga': 'ga-IE', 'gd': 'gd-GB', 'cy': 'cy-GB', 'br': 'br-FR', 'kw': 'kw-GB', 'gv': 'gv-IM',
      
      // Regional European
      'ca': 'ca-ES', 'eu': 'eu-ES', 'gl': 'gl-ES', 'ast': 'ast-ES', 'an': 'an-ES',
      'oc': 'oc-FR', 'co': 'co-FR', 'sc': 'sc-IT', 'rm': 'rm-CH', 'fur': 'fur-IT',
      'lad': 'lad-IL', 'vec': 'vec-IT', 'lmo': 'lmo-IT', 'pms': 'pms-IT', 'nap': 'nap-IT', 'scn': 'scn-IT',
      'mt': 'mt-MT', 'el': 'el-GR',
      
      // Asian languages
      'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR', 'hi': 'hi-IN', 'th': 'th-TH', 'vi': 'vi-VN',
      'id': 'id-ID', 'ms': 'ms-MY', 'tl': 'tl-PH', 'ceb': 'ceb-PH', 'jw': 'jw-ID', 'su': 'su-ID',
      'mg': 'mg-MG', 'haw': 'haw-US', 'mi': 'mi-NZ',
      
      // Indian subcontinent
      'bn': 'bn-BD', 'ta': 'ta-IN', 'te': 'te-IN', 'mr': 'mr-IN', 'gu': 'gu-IN',
      'kn': 'kn-IN', 'ml': 'ml-IN', 'pa': 'pa-IN', 'or': 'or-IN', 'as': 'as-IN',
      'ne': 'ne-NP', 'si': 'si-LK', 'ur': 'ur-PK',
      
      // Middle Eastern
      'ar': 'ar-SA', 'he': 'he-IL', 'fa': 'fa-IR', 'ps': 'ps-AF', 'ku': 'ku-TR',
      'az': 'az-AZ', 'tk': 'tk-TM', 'ky': 'ky-KG', 'kk': 'kk-KZ', 'uz': 'uz-UZ',
      'tg': 'tg-TJ', 'mn': 'mn-MN',
      
      // Caucasian
      'ka': 'ka-GE', 'hy': 'hy-AM', 'ab': 'ab-GE', 'os': 'os-GE',
      
      // Southeast Asian
      'my': 'my-MM', 'km': 'km-KH', 'lo': 'lo-LA', 'dz': 'dz-BT',
      
      // African languages
      'sw': 'sw-TZ', 'am': 'am-ET', 'ti': 'ti-ET', 'om': 'om-ET', 'so': 'so-SO',
      'ha': 'ha-NG', 'yo': 'yo-NG', 'ig': 'ig-NG', 'zu': 'zu-ZA', 'xh': 'xh-ZA',
      'af': 'af-ZA', 'st': 'st-ZA', 'tn': 'tn-ZA', 'ss': 'ss-SZ', 've': 've-ZA',
      'ts': 'ts-ZA', 'nr': 'nr-ZA', 'rw': 'rw-RW', 'rn': 'rn-BI', 'ny': 'ny-MW',
      'sn': 'sn-ZW', 'lg': 'lg-UG', 'ak': 'ak-GH', 'tw': 'tw-GH', 'ee': 'ee-GH',
      'ff': 'ff-SN', 'wo': 'wo-SN', 'bm': 'bm-ML', 'dyu': 'dyu-BF', 'mos': 'mos-BF',
      'fuv': 'fuv-NG', 'kr': 'kr-NG', 'kcg': 'kcg-NG', 'bin': 'bin-NG', 'efi': 'efi-NG',
      'ibo': 'ibo-NG', 'tiv': 'tiv-NG', 'yor': 'yor-NG', 'hau': 'hau-NG',
      
      // Native American languages
      'iu': 'iu-CA', 'oj': 'oj-CA', 'cr': 'cr-CA', 'nv': 'nv-US', 'lkt': 'lkt-US',
      'dak': 'dak-US', 'chy': 'chy-US', 'chr': 'chr-US', 'mus': 'mus-US',
      'qu': 'qu-PE', 'gn': 'gn-PY', 'ay': 'ay-BO',
      
      // Pacific languages
      'to': 'to-TO', 'sm': 'sm-WS', 'ty': 'ty-PF', 'fj': 'fj-FJ', 'niu': 'niu-NU',
      'gil': 'gil-KI', 'mh': 'mh-MH', 'na': 'na-NR', 'tvl': 'tvl-TV', 'pau': 'pau-PW',
      'chk': 'chk-FM', 'pon': 'pon-FM', 'kos': 'kos-FM', 'yap': 'yap-FM',
      
      // Additional European regional
      'lb': 'lb-LU', 'li': 'li-NL', 'nds': 'nds-DE', 'frr': 'frr-DE', 'dsb': 'dsb-DE',
      'hsb': 'hsb-DE', 'csb': 'csb-PL', 'szl': 'szl-PL', 'rue': 'rue-UA', 'be-tarask': 'be-BY',
      
      // Additional Asian
      'bo': 'bo-CN', 'ug': 'ug-CN', 'ii': 'ii-CN', 'za': 'za-CN', 'lzh': 'lzh-CN',
      'gan': 'gan-CN', 'hak': 'hak-CN', 'nan': 'nan-CN', 'wuu': 'wuu-CN', 'yue': 'yue-HK',
      'mn-Cyrl': 'mn-MN', 'mn-Mong': 'mn-CN', 'sah': 'sah-RU', 'tyv': 'tyv-RU',
      'xal': 'xal-RU', 'bua': 'bua-RU', 'cv': 'cv-RU', 'tt': 'tt-RU', 'ba': 'ba-RU',
      'myv': 'myv-RU', 'mdf': 'mdf-RU', 'udm': 'udm-RU', 'kv': 'kv-RU', 'koi': 'koi-RU',
      'mhr': 'mhr-RU', 'mrj': 'mrj-RU', 'chm': 'chm-RU',
      
      // Sign languages (where supported by browsers)
      'sgn': 'en-US', 'ase': 'en-US', 'bsl': 'en-GB', 'fsl': 'fr-FR', 'gsg': 'de-DE',
      
      // Constructed languages
      'eo': 'eo-001', 'ia': 'ia-001', 'ie': 'ie-001', 'io': 'io-001', 'ido': 'ido-001',
      'vo': 'vo-001', 'nov': 'nov-001', 'jbo': 'jbo-001', 'tlh': 'tlh-001',
      
      // Additional African
      'bem': 'bem-ZM', 'loz': 'loz-ZM', 'lun': 'lun-ZM', 'lue': 'lue-ZM', 'nyn': 'nyn-UG',
      'cgg': 'cgg-UG', 'xog': 'xog-UG', 'sog': 'sog-UG', 'teo': 'teo-UG', 'ach': 'ach-UG',
      'lgg': 'lgg-UG', 'ttj': 'ttj-UG', 'alz': 'alz-UG',
      
      // Additional language families
      'hmn': 'hmn-CN', 'mww': 'mww-CN', 'hnj': 'hnj-CN', 'hni': 'hni-CN',
      'cnh': 'cnh-MM', 'ctd': 'ctd-MM', 'flm': 'flm-MM', 'pck': 'pck-MM',
      'shn': 'shn-MM', 'kac': 'kac-MM', 'ksw': 'ksw-MM', 'mnw': 'mnw-MM',
      
      // And many more... (fallback for any unmatched)
    };
    
    // If language not found in map, try to construct a reasonable default
    const mapped = languageMap[language];
    if (mapped) {
      return mapped;
    }
    
    // Fallback logic for unmapped languages
    // Try to construct country code from language code
    const languageToCountry: Record<string, string> = {
      'ab': 'GE', 'ace': 'ID', 'ach': 'UG', 'ada': 'GH', 'ady': 'RU', 'ae': 'AF',
      'aeb': 'TN', 'af': 'ZA', 'ak': 'GH', 'akl': 'PH', 'aln': 'XK', 'alt': 'RU',
      'am': 'ET', 'an': 'ES', 'ang': 'GB', 'anp': 'IN', 'ar': 'SA', 'arc': 'IR',
      'arn': 'CL', 'aro': 'BO', 'ary': 'MA', 'arz': 'EG', 'as': 'IN', 'ast': 'ES',
      'atj': 'CA', 'av': 'RU', 'avk': '001', 'awa': 'IN', 'ay': 'BO', 'az': 'AZ',
      'ba': 'RU', 'bal': 'PK', 'ban': 'ID', 'bar': 'AT', 'bas': 'CM', 'bax': 'CM',
      'bbc': 'ID', 'bbj': 'CM', 'be': 'BY', 'bej': 'SD', 'bem': 'ZM', 'bew': 'ID',
      'bg': 'BG', 'bgn': 'PK', 'bho': 'IN', 'bi': 'VU', 'bik': 'PH', 'bin': 'NG',
      'bjn': 'ID', 'bkm': 'CM', 'bla': 'CA', 'bm': 'ML', 'bn': 'BD', 'bo': 'CN',
      'bpy': 'IN', 'bqi': 'IR', 'br': 'FR', 'bra': 'IN', 'brh': 'PK', 'brx': 'IN',
      'bs': 'BA', 'bss': 'CM', 'bua': 'RU', 'bug': 'ID', 'bum': 'CM', 'byn': 'ER',
      'byv': 'CM', 'ca': 'ES', 'cad': 'US', 'car': 'VE', 'cay': 'CA', 'cch': 'NG',
      'ccp': 'BD', 'ce': 'RU', 'ceb': 'PH', 'cf': '001', 'ch': 'GU', 'chb': 'CO',
      'chg': 'UZ', 'chk': 'FM', 'chm': 'RU', 'chn': 'US', 'cho': 'US', 'chp': 'CA',
      'chr': 'US', 'chy': 'US', 'ckb': 'IQ', 'co': 'FR', 'cop': 'EG', 'cps': 'PH',
      'cr': 'CA', 'crh': 'UA', 'crs': 'SC', 'cs': 'CZ', 'csb': 'PL', 'cu': 'BG',
      'cv': 'RU', 'cy': 'GB', 'da': 'DK', 'dak': 'US', 'dar': 'RU', 'dav': 'KE',
      'de': 'DE', 'del': 'US', 'den': 'CA', 'dgr': 'CA', 'din': 'SS', 'dje': 'NE',
      'doi': 'IN', 'dsb': 'DE', 'dtp': 'MY', 'dua': 'CM', 'dum': 'NL', 'dv': 'MV',
      'dyo': 'SN', 'dyu': 'BF', 'dz': 'BT', 'dzg': 'TD', 'ebu': 'KE', 'ee': 'GH',
      'efi': 'NG', 'egy': 'EG', 'eka': 'KE', 'el': 'GR', 'elx': 'IR', 'en': 'US',
      'enm': 'GB', 'eo': '001', 'es': 'ES', 'esu': 'US', 'et': 'EE', 'eu': 'ES',
      'ewo': 'CM', 'ext': 'ES', 'fa': 'IR', 'fan': 'GQ', 'fat': 'GH', 'ff': 'SN',
      'fi': 'FI', 'fil': 'PH', 'fit': 'SE', 'fj': 'FJ', 'fo': 'FO', 'fr': 'FR',
      'frc': 'US', 'frm': 'FR', 'fro': 'FR', 'frp': 'FR', 'frr': 'DE', 'frs': 'DE',
      'fur': 'IT', 'fy': 'NL', 'ga': 'IE', 'gaa': 'GH', 'gay': 'ID', 'gba': 'CF',
      'gbz': 'IR', 'gd': 'GB', 'gez': 'ET', 'gil': 'KI', 'gl': 'ES', 'glk': 'IR',
      'gmh': 'DE', 'gn': 'PY', 'goh': 'DE', 'gom': 'IN', 'gon': 'IN', 'gor': 'ID',
      'got': 'UA', 'grb': 'LR', 'grc': 'GR', 'gsw': 'CH', 'gu': 'IN', 'guc': 'CO',
      'gur': 'GH', 'guz': 'KE', 'gv': 'IM', 'gwi': 'CA', 'ha': 'NG', 'hai': 'CA',
      'hak': 'CN', 'haw': 'US', 'he': 'IL', 'hi': 'IN', 'hif': 'FJ', 'hil': 'PH',
      'hit': 'TR', 'hmn': 'CN', 'ho': 'PG', 'hr': 'HR', 'hsb': 'DE', 'hsn': 'CN',
      'ht': 'HT', 'hu': 'HU', 'hup': 'US', 'hy': 'AM', 'hz': 'NA', 'ia': '001',
      'iba': 'MY', 'ibb': 'NG', 'id': 'ID', 'ie': '001', 'ig': 'NG', 'ii': 'CN',
      'ij': 'NL', 'ik': 'US', 'ilo': 'PH', 'inc': 'IN', 'ine': 'IN', 'inh': 'RU',
      'io': '001', 'is': 'IS', 'it': 'IT', 'iu': 'CA', 'izh': 'RU', 'ja': 'JP',
      'jam': 'JM', 'jbo': '001', 'jdt': 'CY', 'jgo': 'CM', 'ji': 'UA', 'jmc': 'TZ',
      'jpr': 'IR', 'jrb': 'IR', 'jut': 'DK', 'jv': 'ID', 'ka': 'GE', 'kaa': 'UZ',
      'kab': 'DZ', 'kac': 'MM', 'kaj': 'NG', 'kam': 'KE', 'kaw': 'ID', 'kbd': 'RU',
      'kbl': 'PK', 'kcg': 'NG', 'kde': 'TZ', 'kdt': 'TH', 'kea': 'CV', 'ken': 'CM',
      'kfo': 'CI', 'kg': 'CD', 'kha': 'IN', 'khi': 'BW', 'kho': 'PK', 'ki': 'KE',
      'kiu': 'TR', 'kj': 'NA', 'kk': 'KZ', 'kkj': 'CM', 'kl': 'GL', 'kln': 'KE',
      'km': 'KH', 'kmb': 'AO', 'kn': 'IN', 'ko': 'KR', 'koi': 'RU', 'kok': 'IN',
      'kos': 'FM', 'kpe': 'LR', 'kr': 'NG', 'krc': 'RU', 'kri': 'SL', 'krj': 'PH',
      'krl': 'RU', 'kru': 'IN', 'ks': 'IN', 'ksb': 'TZ', 'ksh': 'DE', 'ku': 'TR',
      'kum': 'RU', 'kut': 'US', 'kv': 'RU', 'kw': 'GB', 'ky': 'KG', 'la': 'VA',
      'lad': 'IL', 'lag': 'TZ', 'lah': 'PK', 'lam': 'ZM', 'lb': 'LU', 'lez': 'RU',
      'lfn': '001', 'lg': 'UG', 'li': 'NL', 'lij': 'IT', 'liv': 'LV', 'lkt': 'US',
      'lmo': 'IT', 'ln': 'CD', 'lo': 'LA', 'lol': 'CD', 'loz': 'ZM', 'lrc': 'IR',
      'lt': 'LT', 'ltg': 'LV', 'lu': 'CD', 'lua': 'CD', 'lui': 'US', 'lun': 'ZM',
      'luo': 'KE', 'lus': 'IN', 'luy': 'KE', 'lv': 'LV', 'lzh': 'CN', 'lzz': 'TR',
      'mad': 'ID', 'maf': 'CM', 'mag': 'IN', 'mai': 'IN', 'mak': 'ID', 'man': 'GN',
      'map': 'PH', 'mas': 'KE', 'mde': 'ZM', 'mdf': 'RU', 'mdr': 'ID', 'men': 'SL',
      'mer': 'KE', 'mfe': 'MU', 'mg': 'MG', 'mga': 'IE', 'mgh': 'MZ', 'mgo': 'CM',
      'mgy': 'TZ', 'mh': 'MH', 'mi': 'NZ', 'mic': 'CA', 'min': 'ID', 'mis': 'US',
      'mk': 'MK', 'mkd': 'MK', 'ml': 'IN', 'mn': 'MN', 'mnc': 'CN', 'mni': 'IN',
      'mns': 'RU', 'mo': 'MD', 'moh': 'CA', 'mos': 'BF', 'mp': 'IN', 'mql': '001',
      'mr': 'IN', 'mrj': 'RU', 'ms': 'MY', 'mt': 'MT', 'mua': 'CM', 'mul': '001',
      'mus': 'US', 'mwl': 'PT', 'mwr': 'IN', 'mwv': 'ID', 'my': 'MM', 'mye': 'MM',
      'myv': 'RU', 'mzn': 'IR', 'na': 'NR', 'nah': 'MX', 'nan': 'CN', 'nap': 'IT',
      'naq': 'NA', 'nb': 'NO', 'nd': 'ZW', 'nds': 'DE', 'ne': 'NP', 'new': 'NP',
      'ng': 'NA', 'ngh': 'NA', 'ngl': 'MZ', 'nhe': 'MX', 'nhn': 'MX', 'nia': 'ID',
      'nij': 'ID', 'niu': 'NU', 'njo': 'IN', 'nl': 'NL', 'nmg': 'CM', 'nn': 'NO',
      'nnh': 'CM', 'no': 'NO', 'nog': 'RU', 'non': 'NO', 'nov': '001', 'nqo': 'GN',
      'nr': 'ZA', 'nsk': 'CA', 'nso': 'ZA', 'nus': 'SS', 'nv': 'US', 'nwc': 'NP',
      'ny': 'MW', 'nym': 'TZ', 'nyn': 'UG', 'nyo': 'UG', 'nzi': 'GH', 'oc': 'FR',
      'oj': 'CA', 'om': 'ET', 'or': 'IN', 'os': 'GE', 'osa': 'US', 'ota': 'TR',
      'pa': 'IN', 'pag': 'PH', 'pal': 'IR', 'pam': 'PH', 'pan': 'IN', 'pap': 'AW',
      'pau': 'PW', 'pcd': 'FR', 'pcm': 'NG', 'pdc': 'US', 'pdt': 'CA', 'peo': 'IR',
      'pfl': 'DE', 'phn': 'LB', 'pi': 'IN', 'pis': 'SB', 'pl': 'PL', 'pms': 'IT',
      'pnt': 'GR', 'pon': 'FM', 'prg': 'LT', 'pro': 'FR', 'ps': 'AF', 'pt': 'BR',
      'qu': 'PE', 'quc': 'GT', 'raj': 'IN', 'rap': 'CL', 'rar': 'CK', 'rc': 'CN',
      'rif': 'MA', 'rm': 'CH', 'rn': 'BI', 'ro': 'RO', 'rof': 'TZ', 'rom': 'RO',
      'root': '001', 'rtm': 'FJ', 'ru': 'RU', 'rue': 'UA', 'rug': 'SB', 'rup': 'MK',
      'rw': 'RW', 'rwk': 'TZ', 'sa': 'IN', 'sad': 'IT', 'saf': 'GH', 'sah': 'RU',
      'sam': 'PS', 'saq': 'KE', 'sas': 'ID', 'sat': 'IN', 'saz': 'IN', 'sba': 'ZM',
      'sbp': 'TZ', 'sc': 'IT', 'scn': 'IT', 'sco': 'GB', 'sd': 'PK', 'sdc': 'IT',
      'sdh': 'IQ', 'se': 'NO', 'see': 'US', 'seh': 'MZ', 'sei': 'MX', 'sel': 'RU',
      'ses': 'ML', 'sg': 'CF', 'sga': 'IE', 'sgs': 'LT', 'sh': 'BA', 'shi': 'MA',
      'shn': 'MM', 'shs': 'CA', 'shu': 'TD', 'si': 'LK', 'sid': 'ET', 'sk': 'SK',
      'sl': 'SI', 'sli': 'PL', 'sly': 'ID', 'sm': 'WS', 'sma': 'SE', 'smj': 'SE',
      'smn': 'FI', 'sms': 'FI', 'sn': 'ZW', 'snk': 'ML', 'so': 'SO', 'sog': 'UZ',
      'sq': 'AL', 'sr': 'RS', 'srn': 'SR', 'srr': 'SN', 'ss': 'SZ', 'ssy': 'ER',
      'st': 'ZA', 'stq': 'DE', 'su': 'ID', 'suk': 'TZ', 'sus': 'GN', 'sux': 'IQ',
      'sv': 'SE', 'sw': 'TZ', 'swb': 'YT', 'swc': 'CD', 'swg': 'DE', 'swv': 'IN',
      'sxn': 'ID', 'syl': 'BD', 'syr': 'TR', 'szl': 'PL', 'ta': 'IN', 'tai': 'PG',
      'tbw': 'PH', 'tcy': 'IN', 'te': 'IN', 'tem': 'SL', 'teo': 'UG', 'ter': 'BR',
      'tet': 'TL', 'tg': 'TJ', 'th': 'TH', 'ti': 'ET', 'tig': 'ER', 'tiv': 'NG',
      'tk': 'TM', 'tkl': 'TK', 'tkr': 'AZ', 'tl': 'PH', 'tlh': '001', 'tli': 'US',
      'tly': 'AZ', 'tmh': 'NE', 'tn': 'ZA', 'to': 'TO', 'tog': 'MW', 'toi': 'ZM',
      'tok': '001', 'tol': 'HN', 'tom': 'RU', 'tpi': 'PG', 'tr': 'TR', 'tru': 'TR',
      'trv': 'TW', 'ts': 'ZA', 'tsd': 'GR', 'tsi': 'CA', 'tt': 'RU', 'ttj': 'UG',
      'ttt': 'AZ', 'tum': 'MW', 'tup': 'BR', 'tut': 'RU', 'tvl': 'TV', 'tw': 'GH',
      'twq': 'NE', 'ty': 'PF', 'tyv': 'RU', 'tzm': 'MA', 'udm': 'RU', 'ug': 'CN',
      'uga': 'SY', 'uk': 'UA', 'umb': 'AO', 'und': '001', 'ur': 'PK', 'uz': 'UZ',
      'vai': 'LR', 've': 'ZA', 'vec': 'IT', 'vep': 'RU', 'vi': 'VN', 'vls': 'BE',
      'vmf': 'DE', 'vo': '001', 'vot': 'RU', 'vro': 'EE', 'vun': 'TZ', 'wa': 'BE',
      'wae': 'CH', 'wal': 'ET', 'war': 'PH', 'was': 'US', 'wbp': 'AU', 'wo': 'SN',
      'wuu': 'CN', 'xal': 'RU', 'xh': 'ZA', 'xmf': 'GE', 'xog': 'UG', 'yao': 'MW',
      'yap': 'FM', 'yav': 'CM', 'ybb': 'CM', 'yi': 'UA', 'yo': 'NG', 'yom': 'ZM',
      'yor': 'NG', 'yrl': 'BR', 'yue': 'HK', 'za': 'CN', 'zap': 'MX', 'zbl': '001',
      'zea': 'NL', 'zen': 'DZ', 'zgh': 'MA', 'zh': 'CN', 'zu': 'ZA', 'zun': 'US',
      'zza': 'TR'
    };
    
    const country = languageToCountry[language];
    if (country) {
      return `${language}-${country}`;
    }
    
    // Final fallback
    return 'en-US';
  };

  // Smart language detection using comprehensive LanguageDetector
  const detectLanguageFromText = async (text: string) => {
    try {
      const { LanguageDetector } = await import('../lib/languageDetection');
      const result = LanguageDetector.detect(text);
      
      // Convert short language code to voice recognition format - comprehensive mapping for 242+ languages
      const languageMapping = {
        // Major languages - these should work reliably
        'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'pt': 'pt-BR', 'de': 'de-DE',
        'it': 'it-IT', 'ru': 'ru-RU', 'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN',
        'ar': 'ar-SA', 'hi': 'hi-IN', 'nl': 'nl-NL', 'sv': 'sv-SE', 'da': 'da-DK', 
        'no': 'no-NO', 'fi': 'fi-FI', 'pl': 'pl-PL', 'tr': 'tr-TR', 'he': 'he-IL',
        
        // Additional well-supported languages
        'th': 'th-TH', 'vi': 'vi-VN', 'cs': 'cs-CZ', 'hu': 'hu-HU', 'is': 'is-IS',
        'bn': 'bn-BD', 'ta': 'ta-IN', 'te': 'te-IN', 'ml': 'ml-IN', 'kn': 'kn-IN', 
        'gu': 'gu-IN', 'pa': 'pa-IN', 'or': 'or-IN', 'as': 'as-IN', 'ne': 'ne-NP', 
        'si': 'si-LK', 'my': 'my-MM', 'km': 'km-KH', 'lo': 'lo-LA', 'ka': 'ka-GE', 
        'hy': 'hy-AM', 'am': 'am-ET', 'sw': 'sw-TZ', 'yo': 'yo-NG', 'ha': 'ha-NG', 
        'ig': 'ig-NG', 'zu': 'zu-ZA', 'af': 'af-ZA', 'mt': 'mt-MT', 'eu': 'eu-ES', 
        'cy': 'cy-GB', 'ga': 'ga-IE', 'gd': 'gd-GB', 'br': 'br-FR', 'ca': 'ca-ES', 
        'gl': 'gl-ES', 'co': 'co-FR', 'be': 'be-BY', 'uk': 'uk-UA', 'bg': 'bg-BG',
        'hr': 'hr-HR', 'sr': 'sr-RS', 'bs': 'bs-BA', 'mk': 'mk-MK', 'sl': 'sl-SI',
        'sk': 'sk-SK', 'ro': 'ro-RO', 'lv': 'lv-LV', 'lt': 'lt-LT', 'et': 'et-EE',
        'sq': 'sq-AL', 'el': 'el-GR', 'id': 'id-ID', 'ms': 'ms-MY', 'tl': 'tl-PH',
        'ceb': 'ceb-PH', 'jw': 'jw-ID', 'su': 'su-ID', 'mg': 'mg-MG', 'haw': 'haw-US',
        'mi': 'mi-NZ', 'fo': 'fo-FO', 'kl': 'kl-GL', 'se': 'se-NO', 'ur': 'ur-PK',
        'fa': 'fa-IR', 'ps': 'ps-AF', 'ku': 'ku-TR', 'az': 'az-AZ', 'tk': 'tk-TM',
        'ky': 'ky-KG', 'kk': 'kk-KZ', 'uz': 'uz-UZ', 'tg': 'tg-TJ', 'mn': 'mn-MN',
        
        // Many more languages supported by our comprehensive detector
        'ab': 'ab-GE', 'os': 'os-GE', 'dz': 'dz-BT', 'ti': 'ti-ET', 'om': 'om-ET', 
        'so': 'so-SO', 'xh': 'xh-ZA', 'st': 'st-ZA', 'tn': 'tn-ZA', 'ss': 'ss-SZ', 
        've': 've-ZA', 'ts': 'ts-ZA', 'nr': 'nr-ZA', 'rw': 'rw-RW', 'rn': 'rn-BI', 
        'ny': 'ny-MW', 'sn': 'sn-ZW', 'lg': 'lg-UG', 'ak': 'ak-GH', 'tw': 'tw-GH', 
        'ee': 'ee-GH', 'ff': 'ff-SN', 'wo': 'wo-SN', 'bm': 'bm-ML', 'dyu': 'dyu-BF', 
        'mos': 'mos-BF', 'fuv': 'fuv-NG', 'kr': 'kr-NG', 'kcg': 'kcg-NG', 'bin': 'bin-NG', 
        'efi': 'efi-NG', 'ibo': 'ibo-NG', 'tiv': 'tiv-NG', 'yor': 'yor-NG', 'hau': 'hau-NG',
        
        // Native American
        'iu': 'iu-CA', 'oj': 'oj-CA', 'cr': 'cr-CA', 'nv': 'nv-US', 'lkt': 'lkt-US',
        'dak': 'dak-US', 'chy': 'chy-US', 'chr': 'chr-US', 'mus': 'mus-US', 'qu': 'qu-PE', 
        'gn': 'gn-PY', 'ay': 'ay-BO',
        
        // Pacific
        'to': 'to-TO', 'sm': 'sm-WS', 'ty': 'ty-PF', 'fj': 'fj-FJ', 'niu': 'niu-NU',
        'gil': 'gil-KI', 'mh': 'mh-MH', 'na': 'na-NR', 'tvl': 'tvl-TV', 'pau': 'pau-PW',
        'chk': 'chk-FM', 'pon': 'pon-FM', 'kos': 'kos-FM', 'yap': 'yap-FM'
        
        // ... and many more covered by getVoiceLanguage fallback logic
      };
      
      console.log(`[VOICE-LANGUAGE-DETECTION] Detected: ${result.language} (${result.confidence}, ${result.method})`);
      return languageMapping[result.language as keyof typeof languageMapping] || 'en-US';
    } catch (error) {
      console.error('[VOICE-LANGUAGE-DETECTION] Error:', error);
      return 'en-US'; // Fallback to English
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Clean up when disabled
  useEffect(() => {
    if (isDisabled && (isRecording || isPaused)) {
      stopRecording();
    }
  }, [isDisabled, isRecording, isPaused]);

  // Initialize accumulated text with current text
  useEffect(() => {
    if (!isRecording && !isPaused) {
      setAccumulatedText(currentText);
    }
  }, [currentText, isRecording, isPaused]);

  // Clear accumulated text if currentText is cleared (message was sent)
  useEffect(() => {
    if (currentText === '' && accumulatedText !== '') {
      console.log('[VOICE] Input was cleared, clearing accumulated text');
      setAccumulatedText('');
      lastSentTextRef.current = '';
      
      // Also stop recording to prevent confusion
      if (isRecording || isPaused) {
        console.log('[VOICE] Stopping recording due to cleared input');
        shouldKeepRecordingRef.current = false;
        
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        
        setIsRecording(false);
        setIsPaused(false);
        setInterimTranscript('');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
      }
    }
  }, [currentText, accumulatedText, isRecording, isPaused]);

  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const setupRecognitionHandlers = (recognition: any) => {
    recognition.onstart = () => {
      console.log('[VOICE] Speech recognition started successfully');
      console.log('[VOICE] Settings - continuous:', recognition.continuous, 'interimResults:', recognition.interimResults);
      setIsRecording(true);
      setIsPaused(false);
      shouldKeepRecordingRef.current = true;
      startTimer();
    };

    recognition.onresult = (event: any) => {
      console.log('[VOICE] 🎯 onresult called with', event.results.length, 'results');
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;
        
        console.log('[VOICE] Result', i, '- isFinal:', result.isFinal, 'confidence:', confidence.toFixed(3));
        console.log('[VOICE] Raw transcript:', transcript);
        
        if (result.isFinal && transcript.trim()) {
          console.log('[VOICE] ✅ Got final result:', transcript);
          
          // Detect language from the transcribed text
          if (language === 'auto') {
            detectLanguageFromText(transcript).then(detectedLang => {
              console.log('[VOICE] 🔍 Language analysis for:', transcript.substring(0, 30) + '...');
              console.log('[VOICE] Current recognition lang:', recognition.lang);
              console.log('[VOICE] Detected from text:', detectedLang);
              
              // If we detect a different language with high confidence, switch
              if (detectedLang !== recognition.lang && transcript.split(' ').length >= 3) {
                console.log('[VOICE] 🔄 Language switch needed:', recognition.lang, '→', detectedLang);
                setDetectedLanguage(detectedLang);
                
                // Update next recognition cycle with new language
                if (shouldKeepRecordingRef.current) {
                  console.log('[VOICE] ✨ Will use', detectedLang, 'for next recognition cycle');
                }
              }
            }).catch(error => {
              console.error('[VOICE] Language detection error:', error);
            });
          }
          
          setAccumulatedText(prev => {
            const newText = prev + (prev ? ' ' : '') + transcript.trim();
            console.log('[VOICE] 📝 Updating accumulated text:', newText);
            
            // Send to parent immediately
            setTimeout(() => {
              console.log('[VOICE] 🚀 Sending to parent:', newText);
              onTranscript(newText, true);
            }, 0);
            
            return newText;
          });
          
          // Auto-restart for continuous capture with potentially updated language
          if (shouldKeepRecordingRef.current && isRecording) {
            console.log('[VOICE] 🔄 Auto-restarting recognition...');
            setTimeout(() => {
              if (shouldKeepRecordingRef.current) {
                // Create new recognition with updated language if needed
                const nextLang = language === 'auto' ? detectedLanguage : getVoiceLanguage(language);
                if (nextLang !== recognition.lang) {
                  console.log('[VOICE] 🌐 Creating new recognition with language:', nextLang);
                  const newRecognition = new SpeechRecognition();
                  newRecognition.continuous = false;
                  newRecognition.interimResults = false;
                  newRecognition.lang = nextLang;
                  newRecognition.maxAlternatives = 1;
                  
                  setupRecognitionHandlers(newRecognition);
                  recognitionRef.current = newRecognition;
                  newRecognition.start();
                } else {
                  recognition.start();
                }
              }
            }, 200); // Slightly longer delay for language switching
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[VOICE] Speech recognition error:', event.error, 'Event:', event);
      console.error('[VOICE] Error details - message:', event.message, 'type:', event.type, 'timeStamp:', event.timeStamp);
      
      switch (event.error) {
        case 'aborted':
          console.log('[VOICE] Recognition aborted - normal stop');
          break;
        case 'no-speech':
          console.log('[VOICE] No speech detected - continuing unlimited recording');
          // Don't stop, let onend handle the restart for unlimited recording
          break;
        case 'audio-capture':
        case 'not-allowed':
          console.error('[VOICE] Critical audio error, stopping');
          shouldKeepRecordingRef.current = false;
          setIsRecording(false);
          stopTimer();
          break;
        default:
          console.error('[VOICE] Other recognition error, but continuing unlimited recording:', event.error);
          // Don't stop for other errors, let auto-restart handle it
          break;
      }
    };

    recognition.onend = () => {
      console.log('[VOICE] Speech recognition ended, shouldKeepRecording:', shouldKeepRecordingRef.current, 'isDisabled:', isDisabled);
      console.log('[VOICE] Current state - isRecording:', isRecording, 'isPaused:', isPaused);
      
      if (shouldKeepRecordingRef.current && !isDisabled) {
        console.log('[VOICE] ATTEMPTING AUTO-RESTART for unlimited recording');
        
        // Immediate restart for truly seamless recording
        const attemptRestart = (attempt = 1) => {
          console.log('[VOICE] Restart attempt', attempt);
          if (shouldKeepRecordingRef.current && !isDisabled) {
            try {
              // Always create fresh recognition to avoid browser limitations
              const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
              if (!SpeechRecognition) {
                console.error('[VOICE] SpeechRecognition not available');
                return;
              }
              
              const freshRecognition = new SpeechRecognition();
              freshRecognition.continuous = false;
              freshRecognition.interimResults = false;
              freshRecognition.lang = language === 'auto' ? detectedLanguage : getVoiceLanguage(language);
              freshRecognition.maxAlternatives = 1;
              
              console.log('[VOICE] Creating fresh recognition instance', attempt);
              processedResultsRef.current = 0; // Reset for new recognition instance
              setupRecognitionHandlers(freshRecognition);
              recognitionRef.current = freshRecognition;
              freshRecognition.start();
              console.log('[VOICE] ✅ Successfully restarted recognition attempt', attempt);
            } catch (error) {
              console.error('[VOICE] ❌ Failed restart attempt', attempt, ':', error);
              
              // Try up to 3 times
              if (attempt < 3) {
                setTimeout(() => attemptRestart(attempt + 1), 500 * attempt);
              } else {
                console.error('[VOICE] All restart attempts failed, stopping recording');
                shouldKeepRecordingRef.current = false;
                setIsRecording(false);
                stopTimer();
              }
            }
          } else {
            console.log('[VOICE] Not attempting restart - shouldKeepRecording:', shouldKeepRecordingRef.current, 'isDisabled:', isDisabled);
          }
        };
        
        setTimeout(() => attemptRestart(), 100);
      } else {
        console.log('[VOICE] Recording ended by user - shouldKeepRecording:', shouldKeepRecordingRef.current, 'isDisabled:', isDisabled);
        setIsRecording(false);
        stopTimer();
      }
    };
  };

  const startRecording = async () => {
    console.log('[VOICE] startRecording clicked - isDisabled:', isDisabled, 'isPaused:', isPaused);
    if (isDisabled) return;

    // If resuming from pause, just restart timer and recognition
    if (isPaused) {
      shouldKeepRecordingRef.current = true;
      setIsPaused(false);
      setIsRecording(true);
      startTimer();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Failed to resume recognition:', error);
          startFreshRecording();
        }
      } else {
        startFreshRecording();
      }
      return;
    }

    // Start fresh recording
    startFreshRecording();
  };

  const startFreshRecording = async () => {
    console.log('[VOICE] Starting fresh recording session');
    try {
      // Request microphone permission with optimized audio settings
      console.log('[VOICE] Requesting microphone access with optimized settings');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
          channelCount: 1     // Mono is sufficient for speech
        } 
      });
      console.log('[VOICE] Microphone access granted with optimized audio settings');
      
      // Clean up the stream since we don't need to keep it active
      // The SpeechRecognition API will handle its own audio capture
      stream.getTracks().forEach(track => track.stop());
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('[VOICE] ❌ Speech recognition not supported in this browser');
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        setIsRecording(false);
        return;
      }
      
      console.log('[VOICE] ✅ Speech Recognition is supported and ready');
      console.log('[VOICE] 🔍 Browser info:', {
        userAgent: navigator.userAgent.substring(0, 100) + '...',
        language: navigator.language,
        languages: navigator.languages,
        onLine: navigator.onLine,
        platform: navigator.platform,
        isChrome: 'webkitSpeechRecognition' in window,
        speechRecognitionType: window.SpeechRecognition ? 'native' : 'webkit'
      });
      console.log('[VOICE] 🧪 Testing language detection...');
      
      // Quick test of language detection with simpler logging
      Promise.all([
        detectLanguageFromText('hello how are you today').then(lang => ({ lang: 'English', result: lang })),
        detectLanguageFromText('hola cómo estás hoy').then(lang => ({ lang: 'Spanish', result: lang })),
        detectLanguageFromText('bonjour comment allez vous').then(lang => ({ lang: 'French', result: lang }))
      ]).then(results => {
        console.log('[VOICE] 📊 Language Detection Test Results:', results);
        results.forEach(r => console.log(`[VOICE] ${r.lang}: ${r.result}`));
      });

      console.log('[VOICE] Creating new SpeechRecognition instance');
      const recognition = new SpeechRecognition();
      
      // Start with user's preferred language or browser language
      const startingLang = language === 'auto' ? detectedLanguage : getVoiceLanguage(language);
      
      recognition.continuous = false; // Non-continuous for better accuracy
      recognition.interimResults = false; // Clean final results only
      recognition.lang = startingLang; // Use detected or preferred language
      recognition.maxAlternatives = 1; // Simple processing
      
      console.log('[VOICE] 🌐 MULTI-LANGUAGE MODE: Starting with', startingLang);
      
      console.log('[VOICE] Starting recognition with language:', recognition.lang);
      console.log('[VOICE] User language setting:', language);
      console.log('[VOICE] Detected language state:', detectedLanguage);
      
      // Optimize for better speech recognition quality
      if ('webkitSpeechRecognition' in window) {
        // Remove problematic serviceURI and use browser defaults
        // (recognition as any).serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
        console.log('[VOICE] Using Chrome/Webkit Speech Recognition with optimized settings');
        // Set grammar hints for better recognition (if supported)
        try {
          const GrammarList = (window as any).webkitSpeechGrammarList;
          if (GrammarList) {
            (recognition as any).grammars = new GrammarList();
          }
        } catch (e) {
          console.log('[VOICE] Grammar hints not available:', e);
        }
      }

      console.log('[VOICE] Recognition settings:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
        maxAlternatives: recognition.maxAlternatives
      });

      // Initialize accumulated text with current content
      setAccumulatedText(currentText);
      setInterimTranscript('');
      processedResultsRef.current = 0; // Reset result tracking
      console.log('[VOICE] Initialized with current text:', currentText);

      // Use centralized handler setup to avoid closure issues
      console.log('[VOICE] Setting up recognition handlers');
      setupRecognitionHandlers(recognition);

      recognitionRef.current = recognition;
      console.log('[VOICE] Starting recognition...');
      recognition.start();

    } catch (error) {
      console.error('[VOICE] Error in startFreshRecording:', error);
      alert('Please allow microphone access to use voice input');
    }
  };

  const pauseRecording = () => {
    console.log('[VOICE] pauseRecording clicked - isRecording:', isRecording);
    if (!isRecording) return;
    
    console.log('[VOICE] Pausing voice recording');
    shouldKeepRecordingRef.current = false;
    setIsPaused(true);
    setIsRecording(false);
    pauseTimer();
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setInterimTranscript('');
  };

  const stopRecording = () => {
    console.log('[VOICE] Stopping recording, accumulated text:', accumulatedText);
    
    shouldKeepRecordingRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Send final accumulated text to parent if different
    if (accumulatedText.trim() && accumulatedText.trim() !== lastSentTextRef.current) {
      setTimeout(() => {
        onTranscript(accumulatedText.trim(), true);
      }, 0);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setInterimTranscript('');
    setAccumulatedText('');
    lastSentTextRef.current = '';
    stopTimer();
    setRecordingTime(0);
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={isPaused ? startRecording : isRecording ? pauseRecording : startRecording}
        disabled={isDisabled}
        className={`p-2 rounded-full transition-all ${
          isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : isPaused
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : isRecording 
              ? 'bg-red-500 text-white animate-pulse shadow-lg' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        title={
          isDisabled 
            ? 'Voice input disabled' 
            : isPaused
              ? 'Resume recording'
            : isRecording 
              ? 'Pause recording' 
              : 'Start voice input'
        }
      >
        {isPaused ? <Mic size={16} /> : isRecording ? <Square size={16} /> : <Mic size={16} />}
      </button>
      
      {(isPaused || recordingTime > 0) && !isRecording && (
        <button
          onClick={stopRecording}
          disabled={isDisabled}
          className="ml-1 p-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600"
          title="Stop and clear recording"
        >
          <Square size={12} />
        </button>
      )}

      {(isRecording || isPaused) && (
        <div className="ml-2 flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className={`w-1 h-3 rounded ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <div className={`w-1 h-4 rounded ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} style={{ animationDelay: '0.1s' }}></div>
            <div className={`w-1 h-2 rounded ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className={`text-xs font-mono ${isRecording ? 'text-red-600' : 'text-yellow-600'}`}>
            {formatTime(recordingTime)} {isPaused ? '(paused)' : ''}
          </span>
          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
            {detectedLanguage.split('-')[0].toUpperCase()}
          </span>
        </div>
      )}

      {interimTranscript && (
        <div className="absolute top-full left-0 mt-1 bg-blue-100 p-2 rounded text-xs text-blue-800 max-w-xs z-10">
          <em>{interimTranscript}</em>
        </div>
      )}
    </div>
  );
}