# DailyBots Client Reference

## RTVIClient

### Overview

The RTVIClient is the primary client-side component for interacting with Daily Bots within the RTVI suite of client libraries. Its core responsibilities include:

- Establishing connection and authentication with bot services
- Configuring bot services
- Managing media connections
- Providing methods, callbacks, and events for bot interaction

### Key Features

- Works with DailyTransport for voice and video communication
- Supports multiple service configurations
- Flexible authentication and connection mechanisms
- Comprehensive callback and event system

### Source Documentation

Available SDK Implementations:
- [RTVI React SDK](link-to-react-docs)
- [RTVI JavaScript SDK](link-to-js-docs)
- [RTVI iOS SDK](link-to-swift-docs)
- [RTVI Android SDK](link-to-kotlin-docs)

## Constructor Parameters

### `baseUrl`
- **Type**: `string`
- **Required**: Yes

The handshake URL for your hosted endpoint that initiates authentication, transport session creation, and bot instantiation.

**Behavior**:
- Sends a JSON POST request to the specified URL
- Passes local configuration as body parameter
- Expects a response from the Daily Bots endpoint to establish connection

**Example**:
```typescript
{
  params: {
    baseUrl: "/api/vi"
  }
}
```

### `endpoints`
- **Type**: `Object<{ [key: string]: string }>`
- **Required**: Yes

Defines local application endpoints for bot connections and actions.

**Structure**:
- `connect`: Endpoint for starting the bot
- `actions`: Endpoint for bot actions

**Example**:
```typescript
{
  params: {
    baseUrl: "/api/v1",
    endpoints: {
      connect: "start-bot",
      actions: "bot-actions"
    }
  }
}
```

### `config`
- **Type**: `Array<RTVIClientConfigOption[]>`
- **Required**: No

Pipeline configuration for registered services.

**Characteristics**:
- Passed to bot at startup
- Can be overridden server-side
- Supports sensitive configuration via server endpoints

**Example**:
```typescript
{
  params: {
    config: [
      {
        service: "tts",
        options: [
          {
            name: "voice",
            value: "79a125e8-cd45-4c13-8a67-188112f4dd22"
          }
        ]
      },
      {
        service: "llm",
        options: [
          {
            name: "model",
            value: "claude-3-5-sonnet-latest"
          },
          {
            name: "initial_messages",
            value: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "You are a pirate."
                  }
                ]
              }
            ]
          },
          {
            name: "run_on_config",
            value: true
          }
        ]
      }
    ]
  }
}
```

### `requestData`
- **Type**: `Object`
- **Required**: No

Custom request body parameters for the connect endpoint.

**Example**:
```typescript
{
  params: {
    requestData: {
      services: {
        tts: "cartesia",
        llm: "anthropic"
      }
    }
  }
}
```

### `callbacks`
- **Type**: `{ callback: () => void }`
- **Required**: No

Array of callback functions for various client events.

### `enableMic`
- **Type**: `boolean`
- **Default**: `true`

Enable the user's local microphone device.

### `enableCamera`
- **Type**: `boolean`
- **Default**: `false`

Enable the user's local webcam device.

### `headers`
- **Type**: `Object<{ [key: string]: string }>`
- **Required**: No

Custom HTTP headers for the initial connect web request.

## Complete Example

```typescript
import { RTVIClient } from "realtime-ai";
import { DailyTransport } from "realtime-ai-daily";

const voiceClient = new RTVIClient({
  params: {
    baseUrl: `PATH_TO_YOUR_CONNECT_ENDPOINT`,
    endpoints: {
      connect: "YOUR_CONNECT_ROUTE",
      actions: "YOUR_ACTIONS_ROUTE"
    },
    config: [
      // Service configurations
    ],
    requestData: {
      services: {
        tts: "cartesia",
        llm: "anthropic"
      }
    }
  },
  transport: new DailyTransport(),
  enableMic: true,
  enableCam: false,
  callbacks: {
    onBotReady: () => {
      console.log("Bot is ready!");
    }
  }
});

try {
  await voiceClient.connect();
} catch (e) {
  console.log(e.message || "Unknown error occurred");
  voiceClient.disconnect();
}
```

## Best Practices

- Always provide a `DailyTransport` for Daily Bots
- Handle connection and disconnection errors
- Use server-side endpoints for sensitive configurations
- Implement comprehensive error handling
- Configure services and initial states carefully

## Troubleshooting

- Verify `baseUrl` and `endpoints` are correctly configured
- Check network connectivity
- Ensure all required service configurations are provided
- Review server-side endpoint implementations
- Use verbose logging for debugging connection issues

## Configuration

### Overview

The RTVIClient configuration is a powerful mechanism for defining and customizing services for Daily Bots. This section provides comprehensive guidance on configuring your bot's services and capabilities.

### Services Overview

Daily Bots typically expect a core set of services:
- Speech-to-Text (STT)
- Large Language Model (LLM)
- Text-to-Speech (TTS)

#### Service Configuration Structure

```json
{
  "services": {
    "stt": "<stt service name>",
    "tts": "<tts service name>",
    "llm": "<llm service name>"
  }
}
```

### Configuration Object

#### Key Characteristics
- Configurations are applied sequentially
- Order matters for deterministic outcomes
- Supports dynamic service configuration

#### Configuration Format

```json
{
  "config": [
    {
      "service": "tts" | "llm" | "stt",
      "options": [
        {
          "name": "<option name>",
          "value": "<option value>"
        }
      ]
    }
  ]
}
```

### Speech-to-Text (STT) Configuration

#### Key Parameters
- `model`: Transcription model
- `language`: Transcription language

**Example**:
```typescript
{
  "service": "stt",
  "options": [
    {
      "name": "model",
      "value": "whisper-large-v3"
    },
    {
      "name": "language",
      "value": "en"
    }
  ]
}
```

### Text-to-Speech (TTS) Configuration

#### Key Parameters
- `voice`: Selected voice identifier
- `model`: TTS model (optional)

**Example**:
```typescript
{
  "service": "tts",
  "options": [
    {
      "name": "voice",
      "value": "79a125e8-cd45-4c13-8a67-188112f4dd22"
    },
    {
      "name": "model",
      "value": "advanced-tts-model"
    }
  ]
}
```

### Large Language Model (LLM) Configuration

#### Core Functionality Options

##### `model`
- **Type**: `string`
- **Required**: Yes
- Specifies the LLM model to use

**Example**:
```typescript
{
  "name": "model",
  "value": "claude-3-5-sonnet-latest"
}
```

##### `initial_messages`
- **Type**: `Array[LLM messages]`
- **Required**: Yes (first configuration)
- Sets initial system and context messages

**Example**:
```typescript
{
  "name": "initial_messages",
  "value": [{
    "role": "user",
    "content": [{
      "type": "text",
      "text": "You are a helpful assistant."
    }]
  }]
}
```

##### `run_on_config`
- **Type**: `boolean`
- **Default**: `false`
- Forces bot to initiate conversation

**Example**:
```typescript
{
  "name": "run_on_config",
  "value": true
}
```

##### `tools`
- **Type**: `Array[Tool Definition]`
- **Optional**: Supports function calling
- Defines available tools for the LLM

**Example**:
```typescript
{
  "name": "tools",
  "value": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City and state"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

### Advanced Configuration Techniques

#### Dynamic Configuration Updates
- Use `updateConfig()` method to modify configurations
- Supports partial or complete configuration changes

#### Configuration Ordering
- Place configuration options strategically
- Ensure dependencies are resolved in correct order

### Best Practices

1. Always specify required service configurations
2. Use the most appropriate models for your use case
3. Implement comprehensive initial messages
4. Leverage tools and function calling when possible
5. Test configurations thoroughly

### Common Pitfalls

- Misconfiguring service-specific parameters
- Ignoring model and language dependencies
- Overlooking initial message importance
- Not handling configuration errors

### Debugging Configuration

- Enable verbose logging
- Validate service and model compatibility
- Check API key and authentication
- Use configuration validation tools

### References

- [Supported Services](link-to-supported-services)
- [RTVI API Reference](link-to-api-reference)
- Service-specific API documentations:
  - [Anthropic Messages API](link-to-anthropic-docs)
  - [OpenAI Messages API](link-to-openai-docs)
  - [Groq Messages API](link-to-groq-docs)
  - [Together AI Messages API](link-to-together-docs)
