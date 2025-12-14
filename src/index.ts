import axios, { AxiosInstance, AxiosError } from 'axios';
import * as crypto from 'crypto';

// Base URL encoded in base64 for obfuscation
const DEFAULT_BASE_URL_B64 = 'aHR0cHM6Ly9rZXljbGFpbS5vcmc='; // https://keyclaim.org

export interface KeyClaimConfig {
  apiKey: string;
  secret?: string;
}

export interface CreateChallengeOptions {
  ttl?: number;
}

export interface CreateChallengeResponse {
  challenge: string;
  expires_in: number;
  encrypted?: boolean;
}

export interface ValidateChallengeOptions {
  challenge: string;
  response: string;
  decryptedChallenge?: string;
}

export interface ValidateChallengeResponse {
  valid: boolean;
  signature?: string;
  quota?: {
    used: number;
    remaining: number;
    quota: number | 'unlimited';
  };
  error?: string;
}

export type ResponseMethod = 'echo' | 'hmac' | 'hash' | 'custom';

export class KeyClaimError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'KeyClaimError';
    Object.setPrototypeOf(this, KeyClaimError.prototype);
  }
}

export class KeyClaimClient {
  private apiKey: string;
  private baseUrl: string;
  private secret: string;
  private axiosInstance: AxiosInstance;

  constructor(config: KeyClaimConfig | string, secret?: string) {
    // Decode default base URL from base64
    const defaultBaseUrl = Buffer.from(DEFAULT_BASE_URL_B64, 'base64').toString('utf-8');

    // Support both object config and legacy positional arguments
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = defaultBaseUrl;
      this.secret = secret || config; // Use API key as default secret
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = defaultBaseUrl;
      this.secret = config.secret || config.apiKey;
    }

    if (!this.apiKey || !this.apiKey.startsWith('kc_')) {
      throw new KeyClaimError('Invalid API key format. API key must start with "kc_"');
    }

    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/api`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new challenge
   * @param options Challenge creation options
   * @returns Challenge data
   */
  async createChallenge(options: CreateChallengeOptions = {}): Promise<CreateChallengeResponse> {
    try {
      const response = await this.axiosInstance.post<CreateChallengeResponse>(
        '/challenge/create',
        {
          ttl: options.ttl || 30,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create challenge');
    }
  }

  /**
   * Generate a response from a challenge using the specified method
   * @param challenge The challenge string
   * @param method Response generation method ('echo', 'hmac', 'hash', or 'custom')
   * @param customData Optional custom data for custom method
   * @returns Generated response string
   */
  generateResponse(
    challenge: string,
    method: ResponseMethod = 'hmac',
    customData?: unknown
  ): string {
    switch (method) {
      case 'echo':
        return challenge;

      case 'hmac':
        return crypto
          .createHmac('sha256', this.secret)
          .update(challenge)
          .digest('hex');

      case 'hash':
        return crypto
          .createHash('sha256')
          .update(challenge + this.secret)
          .digest('hex');

      case 'custom': {
        if (!customData) {
          throw new KeyClaimError('Custom data is required for custom method');
        }
        const data = typeof customData === 'string'
          ? `${challenge}:${customData}`
          : `${challenge}:${JSON.stringify(customData)}`;
        return crypto.createHash('sha256').update(data).digest('hex');
      }

      default:
        throw new KeyClaimError(`Unknown response method: ${method}`);
    }
  }

  /**
   * Validate a challenge-response pair
   * @param options Validation options
   * @returns Validation result
   */
  async validateChallenge(
    options: ValidateChallengeOptions
  ): Promise<ValidateChallengeResponse> {
    try {
      const response = await this.axiosInstance.post<ValidateChallengeResponse>(
        '/challenge/validate',
        {
          challenge: options.challenge,
          response: options.response,
          decryptedChallenge: options.decryptedChallenge,
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; valid?: boolean }>;
      
      // If the API returns a validation response (even if invalid), return it
      if (axiosError.response?.data && 'valid' in axiosError.response.data) {
        return {
          valid: false,
          error: axiosError.response.data.error || 'Validation failed',
        };
      }

      throw this.handleError(error, 'Failed to validate challenge');
    }
  }

  /**
   * Complete flow: create challenge, generate response, and validate
   * @param method Response generation method
   * @param ttl Challenge TTL in seconds
   * @param customData Optional custom data for custom method
   * @returns Complete validation result
   */
  async validate(
    method: ResponseMethod = 'hmac',
    ttl: number = 30,
    customData?: unknown
  ): Promise<ValidateChallengeResponse> {
    try {
      // Create challenge
      const { challenge } = await this.createChallenge({ ttl });

      // Generate response
      const response = this.generateResponse(challenge, method, customData);

      // Validate
      return await this.validateChallenge({ challenge, response });
    } catch (error) {
      throw this.handleError(error, 'Validation flow failed');
    }
  }

  /**
   * Handle errors and convert to KeyClaimError
   */
  private handleError(error: unknown, defaultMessage: string): KeyClaimError {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    if (axiosError.response) {
      const statusCode = axiosError.response.status;
      const errorData = axiosError.response.data;
      const errorMessage = errorData?.error || errorData?.message || axiosError.message;

      return new KeyClaimError(
        errorMessage || defaultMessage,
        errorData?.error,
        statusCode
      );
    }

    if (axiosError.request) {
      return new KeyClaimError(
        'Network error: No response received from server',
        'network_error'
      );
    }

    return new KeyClaimError(
      axiosError.message || defaultMessage,
      'unknown_error'
    );
  }
}

// Export default instance factory
export function createClient(
  config: KeyClaimConfig | string,
  secret?: string
): KeyClaimClient {
  return new KeyClaimClient(config, secret);
}

// Default export
export default KeyClaimClient;

