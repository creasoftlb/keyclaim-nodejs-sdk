# KeyClaim Node.js SDK

Official KeyClaim SDK for Node.js - MITM protection and challenge validation.

## Installation

```bash
npm install @keyclaim/sdk
```

## Quick Start

```javascript
const { KeyClaimClient } = require('@keyclaim/sdk');

// Initialize client (base URL is automatically set)
const client = new KeyClaimClient({
  apiKey: 'kc_your_api_key_here',
  secret: 'your-secret-key' // Optional, defaults to API key
});

// Complete validation flow
async function main() {
  try {
    // Create challenge, generate response, and validate in one call
    const result = await client.validate('hmac', 30);
    
    if (result.valid) {
      console.log('✓ Validation successful!');
      console.log('Signature:', result.signature);
      console.log('Quota:', result.quota);
    } else {
      console.log('✗ Validation failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Step-by-Step Usage

### 1. Create a Challenge

```javascript
const { challenge, expires_in } = await client.createChallenge({ ttl: 30 });
console.log('Challenge:', challenge);
```

### 2. Generate Response

```javascript
// Using HMAC (recommended)
const response = client.generateResponse(challenge, 'hmac');

// Or using other methods
const echoResponse = client.generateResponse(challenge, 'echo');
const hashResponse = client.generateResponse(challenge, 'hash');
```

### 3. Validate Challenge

```javascript
const result = await client.validateChallenge({
  challenge: challenge,
  response: response
});

if (result.valid) {
  console.log('Validation successful!');
} else {
  console.log('Validation failed:', result.error);
}
```

## API Reference

### `KeyClaimClient`

#### Constructor

```javascript
new KeyClaimClient(config)
new KeyClaimClient(apiKey, secret?)
```

**Parameters:**
- `config` (object):
  - `apiKey` (string, required): Your KeyClaim API key (must start with `kc_`)
  - `secret` (string, optional): Secret for HMAC generation (default: API key)
- Or positional arguments:
  - `apiKey` (string, required): Your KeyClaim API key
  - `secret` (string, optional): Secret for HMAC generation

**Note:** The base URL is automatically set to `https://keyclaim.org` and cannot be overridden.

**Example:**
```javascript
// Using object config
const client = new KeyClaimClient({
  apiKey: 'kc_your_api_key',
  secret: 'your-secret'
});

// Using positional arguments
const client = new KeyClaimClient('kc_your_api_key', 'your-secret');
```

#### Methods

##### `createChallenge(options?)`

Create a new challenge.

**Parameters:**
- `options` (object, optional):
  - `ttl` (number, optional): Time to live in seconds (default: 30)

**Returns:** `Promise<CreateChallengeResponse>`

**Example:**
```javascript
const { challenge, expires_in } = await client.createChallenge({ ttl: 60 });
```

##### `generateResponse(challenge, method?, customData?)`

Generate a response from a challenge.

**Parameters:**
- `challenge` (string, required): The challenge string
- `method` (string, optional): Response method - `'echo'`, `'hmac'`, `'hash'`, or `'custom'` (default: `'hmac'`)
- `customData` (any, optional): Custom data for `'custom'` method

**Returns:** `string`

**Example:**
```javascript
const response = client.generateResponse(challenge, 'hmac');
```

##### `validateChallenge(options)`

Validate a challenge-response pair.

**Parameters:**
- `options` (object, required):
  - `challenge` (string, required): The challenge string
  - `response` (string, required): The generated response
  - `decryptedChallenge` (string, optional): Decrypted challenge if encrypted

**Returns:** `Promise<ValidateChallengeResponse>`

**Example:**
```javascript
const result = await client.validateChallenge({
  challenge: challenge,
  response: response
});
```

##### `validate(method?, ttl?, customData?)`

Complete validation flow: create challenge, generate response, and validate.

**Parameters:**
- `method` (string, optional): Response method (default: `'hmac'`)
- `ttl` (number, optional): Challenge TTL in seconds (default: 30)
- `customData` (any, optional): Custom data for `'custom'` method

**Returns:** `Promise<ValidateChallengeResponse>`

**Example:**
```javascript
const result = await client.validate('hmac', 30);
```

## Response Methods

### Echo (Testing Only)
```javascript
const response = client.generateResponse(challenge, 'echo');
// Returns the challenge as-is
```

### HMAC-SHA256 (Recommended)
```javascript
const response = client.generateResponse(challenge, 'hmac');
// Returns HMAC-SHA256 hash of challenge using secret
```

### SHA256 Hash
```javascript
const response = client.generateResponse(challenge, 'hash');
// Returns SHA256 hash of challenge + secret
```

### Custom
```javascript
const response = client.generateResponse(challenge, 'custom', {
  userId: '123',
  timestamp: Date.now()
});
// Returns SHA256 hash of challenge + custom data
```

## Error Handling

The SDK throws `KeyClaimError` for all errors:

```javascript
const { KeyClaimClient, KeyClaimError } = require('@keyclaim/sdk');

try {
  const result = await client.validate();
} catch (error) {
  if (error instanceof KeyClaimError) {
    console.error('KeyClaim Error:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.statusCode);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## TypeScript Support

The SDK includes TypeScript definitions:

```typescript
import { KeyClaimClient, CreateChallengeResponse, ValidateChallengeResponse } from '@keyclaim/sdk';

const client = new KeyClaimClient({
  apiKey: 'kc_your_api_key',
});

const challenge: CreateChallengeResponse = await client.createChallenge();
const result: ValidateChallengeResponse = await client.validateChallenge({
  challenge: challenge.challenge,
  response: 'generated_response'
});
```

## Examples

### Basic Validation

```javascript
const { KeyClaimClient } = require('@keyclaim/sdk');

const client = new KeyClaimClient('kc_your_api_key', undefined, 'your-secret');

async function validate() {
  const result = await client.validate('hmac');
  console.log('Valid:', result.valid);
}
```

### Custom Response Generation

```javascript
const client = new KeyClaimClient('kc_your_api_key');

const { challenge } = await client.createChallenge();
const response = client.generateResponse(challenge, 'custom', {
  userId: 'user123',
  timestamp: Date.now()
});
const result = await client.validateChallenge({ challenge, response });
```

### Error Handling with Retry

```javascript
async function createChallengeWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.createChallenge();
    } catch (error) {
      if (error.statusCode === 401) {
        throw new Error('Invalid API key');
      }
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## License

MIT

## Support

- Documentation: https://keyclaim.org/docs
- Issues: https://github.com/creasoftlb/keyclaim-nodejs-sdk/issues

