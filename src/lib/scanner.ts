// Safe Luhn Check algorithm for credit cards
export function luhnCheck(numStr: string): boolean {
  if (typeof numStr !== 'string') return false;
  
  // Fast sanitization avoiding global regex allocation where possible
  let sanitized = '';
  for (let i = 0; i < numStr.length; i++) {
    const charCode = numStr.charCodeAt(i);
    // Keep digits '0'-'9' (48-57)
    if (charCode >= 48 && charCode <= 57) {
      sanitized += numStr[i];
    }
  }

  const sanitizedLength = sanitized.length;
  if (sanitizedLength < 13 || sanitizedLength > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitizedLength - 1; i >= 0; i--) {
    let digit = sanitized.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Pre-compiled fast path lookup sets and arrays
const EXCLUDED_DIRS = ['node_modules/', '.next/', 'dist/', 'build/', '.git/', '__pycache__/', '.turbo/', 'coverage/'];
const EXCLUDED_EXTENSIONS = [
  '.min.js', '.min.css', '.bundle.js', '.map', '.wasm',
  '.jpg', '.jpeg', '.png', '.gif', '.ico', '.svg', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.pdf', '.zip', '.tar', '.gz', '.tgz', '.rar', '.7z',
  '.exe', '.bin', '.dll', '.so', '.dylib', '.sqlite', '.db'
];
const EXCLUDED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.ds_store',
  'firebase-applet-config.json', 'firebase-blueprint.json',
  'changed_files.json', 'missing_files.json', 'remote_blobs.json'
]);

export function isSkippableFile(filePath: string): boolean {
  if (typeof filePath !== 'string') return false;
  const normalizedPath = filePath.toLowerCase();

  for (let i = 0; i < EXCLUDED_DIRS.length; i++) {
    if (normalizedPath.includes(EXCLUDED_DIRS[i])) return true;
  }

  for (let i = 0; i < EXCLUDED_EXTENSIONS.length; i++) {
    if (normalizedPath.endsWith(EXCLUDED_EXTENSIONS[i])) return true;
  }

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  const fileName = lastSlashIndex === -1 ? normalizedPath : normalizedPath.substring(lastSlashIndex + 1);

  if (EXCLUDED_FILES.has(fileName)) return true;
  if (fileName === '.env' || fileName.startsWith('.env.')) return true;

  return false;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface SensitivePattern {
  name: string;
  regex: RegExp;
  confidence: ConfidenceLevel;
  validate?: (val: string) => boolean;
}

export const SENSITIVE_PATTERNS: readonly SensitivePattern[] = [
  { name: 'OpenAI API Key', regex: /(?:sk-[a-zA-Z0-9]{20,48}|sk-proj-[a-zA-Z0-9]{20,48})/g, confidence: 'high' },
  { name: 'Anthropic API Key', regex: /sk-ant-api03-[a-zA-Z0-9\-_]{93}AA/g, confidence: 'high' },
  { name: 'Google Gemini API Key', regex: /AIza[0-9A-Za-z\-_]{35,45}/g, confidence: 'high' },
  { name: 'Cohere API Key', regex: /cohere\s*[:=]\s*['"][a-zA-Z0-9]{40}['"]/gi, confidence: 'medium' },
  { name: 'Mistral API Key', regex: /mistral\s*[:=]\s*['"][a-zA-Z0-9]{32}['"]/gi, confidence: 'medium' },
  { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, confidence: 'high' },
  { name: 'AWS Secret Access Key', regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"]?([a-zA-Z0-9/+=]{40})['"]?/gi, confidence: 'medium' },
  { name: 'GCP Service Account', regex: /"type":\s*"service_account"/g, confidence: 'high' },
  { name: 'Azure Storage Key', regex: /DefaultEndpointsProtocol=[^;]+;AccountName=[^;]+;AccountKey=[a-zA-Z0-9+/=]{86}==/g, confidence: 'high' },
  { name: 'GitHub PAT', regex: /gh[pusr]_[a-zA-Z0-9]{36}/g, confidence: 'high' },
  { name: 'GitHub Fine-Grained Token', regex: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g, confidence: 'high' },
  { name: 'GitLab Token', regex: /glpat-[a-zA-Z0-9\-]{20}/g, confidence: 'high' },
  { name: 'MongoDB URI', regex: /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/g, confidence: 'high' },
  { name: 'PostgreSQL URI', regex: /postgres(?:ql)?:\/\/[^\s"'<>]+/g, confidence: 'high' },
  { name: 'Redis URI', regex: /redis(?:\+sentinel)?:\/\/[^\s"'<>]+/g, confidence: 'high' },
  { name: 'Firebase Web API Key', regex: /AIza[a-zA-Z0-9_\-]{35}/g, confidence: 'high' },
  { name: 'Stripe Secret Key', regex: /(?:sk|rk)_(?:test|live)_[a-zA-Z0-9]{24,99}/g, confidence: 'high' },
  { name: 'PayPal API Token', regex: /access_token\$production\$[a-zA-Z0-9]+/g, confidence: 'high' },
  { name: 'Twilio API Key', regex: /SK[a-z0-9]{32}/g, confidence: 'high' },
  { name: 'Slack Token', regex: /xox[baprs]-[a-zA-Z0-9]{10,48}/g, confidence: 'high' },
  { name: 'Discord Token', regex: /[a-zA-Z0-9_-]{24}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}/g, confidence: 'high' },
  { name: 'Notion API Key', regex: /secret_[a-zA-Z0-9]{43}/g, confidence: 'high' },
  { name: 'Shopify Access Token', regex: /shpat_[a-fA-F0-9]{32}/g, confidence: 'high' },
  { name: 'SendGrid API Key', regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g, confidence: 'high' },
  { name: 'Mailgun API Key', regex: /key-[0-9a-zA-Z]{32}/g, confidence: 'high' },
  { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, confidence: 'low' },
  { name: 'RSA Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, confidence: 'high' },
  { name: 'OAuth/<OAUTH_BEARER_TOKEN_REDACTED>', regex: /Bearer\s+([a-zA-Z0-9\-._~+/]+=*)/gi, confidence: 'low' },
  { name: 'Credit Card', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, confidence: 'medium', validate: luhnCheck },
  { name: 'Email Address', regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, confidence: 'low' },
  { name: 'IP Address', regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, confidence: 'low' },
  { name: 'MAC Address', regex: /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/g, confidence: 'low' },
  { name: 'IBAN', regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g, confidence: 'low' },
] as const;

export interface Finding {
  type: string;
  confidence: ConfidenceLevel;
  severity: SeverityLevel;
  lineNum: number;
  snippet: string;
  match: string;
}

// Optimized Shannon entropy calculation with minimal object allocations
export function calculateEntropy(inputString: string): number {
  if (typeof inputString !== 'string') return 0;
  const length = inputString.length;
  if (length === 0) return 0;

  const characterFrequencies = new Map<number, number>();
  for (let i = 0; i < length; i++) {
    const code = inputString.charCodeAt(i);
    characterFrequencies.set(code, (characterFrequencies.get(code) || 0) + 1);
  }

  let entropy = 0;
  const inverseLength = 1 / length;
  for (const count of characterFrequencies.values()) {
    const probability = count * inverseLength;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

export function getSeverity(confidence: string): SeverityLevel {
  switch (confidence) {
    case 'high': return 'Critical';
    case 'medium': return 'High';
    default: return 'Low';
  }
}

const VAR_REGEX = /[a-zA-Z0-9_\-]*(?:key|token|secret|password|credential|auth|hash|sha|md5)[a-zA-Z0-9_\-]*\s*[:=]\s*(['"])([^'"]+)\1/gi;

export function sanitizeContent(content: string): { sanitized: string; findings: Finding[] } {
  if (typeof content !== 'string' || content.length === 0) {
    return { sanitized: '', findings: [] };
  }

  const findings: Finding[] = [];
  const lines = content.split('\n');
  const numLines = lines.length;
  const sanitizedLines: string[] = new Array(numLines);

  for (let i = 0; i < numLines; i++) {
    let currentLine = lines[i] ?? '';
    const scanLine = currentLine.length > 3000 ? currentLine.substring(0, 3000) : currentLine;
    const currentLineNum = i + 1;

    for (let p = 0; p < SENSITIVE_PATTERNS.length; p++) {
      const pattern = SENSITIVE_PATTERNS[p];
      if (!pattern) continue;
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(scanLine)) !== null) {
        const matchedValue = match[0];
        if (!matchedValue) break;

        if (pattern.validate && !pattern.validate(matchedValue)) {
          continue;
        }

        let isExistingFinding = false;
        for (let f = 0; f < findings.length; f++) {
          const finding = findings[f];
          if (finding && finding.lineNum === currentLineNum && finding.match === matchedValue) {
            isExistingFinding = true;
            break;
          }
        }

        if (!isExistingFinding) {
          const matchIndex = match.index;
          const snippetStart = matchIndex > 20 ? matchIndex - 20 : 0;
          const snippetEnd = matchIndex + matchedValue.length + 20;
          const actualSnippetEnd = snippetEnd < currentLine.length ? snippetEnd : currentLine.length;

          findings.push({
            type: pattern.name,
            confidence: pattern.confidence,
            severity: getSeverity(pattern.confidence),
            lineNum: currentLineNum,
            snippet: currentLine.substring(snippetStart, actualSnippetEnd).trim(),
            match: matchedValue
          });
        }

        const placeholder = `<${pattern.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_REDACTED>`;
        currentLine = currentLine.replace(matchedValue, placeholder);
      }
    }

    VAR_REGEX.lastIndex = 0;
    let varMatch: RegExpExecArray | null;
    while ((varMatch = VAR_REGEX.exec(scanLine)) !== null) {
      const secretValue = varMatch[2];
      if (secretValue && secretValue.length > 18 && calculateEntropy(secretValue) > 4.2) {
        let alreadyFound = false;
        for (let f = 0; f < findings.length; f++) {
          const finding = findings[f];
          if (finding && finding.lineNum === currentLineNum && finding.match === secretValue) {
            alreadyFound = true;
            break;
          }
        }

        if (!alreadyFound) {
          findings.push({
            type: 'High Entropy Secret',
            confidence: 'medium',
            severity: 'High',
            lineNum: currentLineNum,
            snippet: currentLine.substring(0, currentLine.length < 70 ? currentLine.length : 70).trim(),
            match: secretValue
          });
          currentLine = currentLine.replace(secretValue, '<ENTROPY_SECRET_REDACTED>');
        }
      }
    }

    sanitizedLines[i] = currentLine;
  }

  return { sanitized: sanitizedLines.join('\n'), findings };
}
