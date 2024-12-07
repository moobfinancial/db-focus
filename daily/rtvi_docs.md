# RTVI API Services

## Selecting and authenticating bot services

Bots built with RTVI define and register various services as part of their pipeline. For example, a typical voice bot will likely use Language Models (LLM), text-to-speech, and speech-to-text services to provide voice-to-voice interactions.

RTVI clients allow you to specify which of the available services to use in a session and how to configure them.

## Understanding Services

Your RTVI client can configure any services registered in an RTVI-powered bot using the configuration options it makes available.

Service registration within your bot might look something like this pseudocode:

```python
def main(services:dict, api_keys:dict):
    rtvi_llm = RTVIService(
        name="llm",
        options=[
            RTVIServiceOption(
                name="model",
                type="string",
                handler=config_llm_model_handler),
            RTVIServiceOption(
                name="messages",
                type="array",
                handler=config_llm_messages_handler)])

    rtvi = RTVIProcessor(config=config)
    rtvi.register_service(rtvi_llm)

    def service_factory_get(service: str, name: str, api_key: str) -> Any:
        match service:
            case "openai":
                return OpenAILLMService(
                    name=name,
                    api_key=api_key)
            case "together":
                return OpenAILLMService(
                    name=name,
                    api_key=api_key,
                    base_url="https://api.together.xyz"
                )

llm = service_factory_get(services["llm"], "llm", api_keys[api_keys["llm"]] or "")

# ... pipeline code
```

The above bot file defines a service named `llm` with two config options, `model` and `messages`, as well as their associated handlers.

Bots can define one or more services to a particular function. For example, we may want to run a pipeline that can be switched between different LLM providers e.g. OpenAI, Together, Anthropic etc.

Building a client requires knowledge of the services that have been registered and the corresponding names. This information is necessary to pass the appropriate configuration and API keys as string-matched values.

## Names and Providers

In the above example, we have a factory method that returns the relevant provider class for a specific service based on name string.

- **Service Name**: An arbitrary string that references the service in your bot file, e.g. "llm"
- **Service Provider**: A provider-specific implementation that gets included in the pipeline, e.g. OpenAILLMService

## Selecting Between Services on the Client

RTVI bots can be passed an optional services object at startup that can be used to specify which provider to use for the specified service name.

In the above example, we can configure a voice client to use Together like so:

```javascript
const voiceClient = new VoiceClient({
  services: {
    llm: "together",
  },
  config: [
    {
      service: "llm",
      options: [
        { name: "model", value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" },
      ],
    },
  ],
  // etc ...
});
```

## Passing API Keys

Service keys are secret, you should not set them on a client. To pass API keys to your RTVI bot, host a secure server-side endpoint that includes them as part of the config payload.

RTVI bots accept an `api_keys` object, mapping them to the relevant service account. Here is an example server-side route using NextJS:

```typescript
// api/
export async function POST(request: Request) {
  const { services, config } = await request.json();

  if (!services || !config || !process.env.DAILY_BOTS_URL) {
    return new Response(`Services or config not found on request body`, {
      status: 400,
    });
  }

  const payload = {
    services,
    api_keys: {
      together: process.env.TOGETHER_API_KEY,
    },
    config: [...config],
  };

  const req = await fetch("your-bot-start-endpoint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const res = await req.json();

  return Response.json(res);
}
```

You can also extend your config object here, if you wanted to provide some defaults outside of the client constructor.

In the above example, we'd set the `baseUrl` property of the voice client to point to this endpoint, and define which services to use in the bot's registry like so:

```javascript
const voiceClient = new DailyVoiceClient({
  baseUrl: "/api",
  services: {
    llm: "together",
  },
  config: [
    {
      service: "llm",
      options: [
        { name: "model", value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" },
      ],
    },
  ],
});
```

- `config` references the service name that it was registered with in your bot file.
- `services` specifies which provider / service account to use for a specific name-matched service in the registry (in this case, `llm`.)
- `api_keys` provides a key matched to the service account.

## API Configuration

### Passing Service Configuration Values to a Bot

RTVI bots expose services and service configuration options to clients.

Your client config can be set when initializing your bot or at runtime.

A typical bot config, in JSON, might look like this:

```json
[
  { 
    "service": "vad", 
    "options": [{ 
      "name": "params", 
      "value": {"stop_secs": 3.0} 
    }] 
  },
  {
    "service": "tts",
    "options": [{ 
      "name": "voice", 
      "value": "79a125e8-cd45-4c13-8a67-188112f4dd22" 
    }]
  },
  {
    "service": "llm",
    "options": [
      { 
        "name": "model", 
        "value": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" 
      },
      {
        "name": "initial_messages",
        "value": [
          {
            "role": "system",
            "content": "You are a assistant called ExampleBot. You can ask me anything. Keep responses brief and legible. Your responses will converted to audio. Please do not include any special characters in your response other than '!' or '?'. Start by briefly introducing yourself."
          }
        ]
      },
      { 
        "name": "run_on_config", 
        "value": true 
      }
    ]
  }
]
```

### Client-Side Configuration

You can pass a config into the VoiceClient constructor. Passing a config from the client is optional. A bot will always start with a default config if no config is passed from the client. Some RTVI implementations may also choose to ignore configs passed from the client, for security or other reasons.

### Getting the Bot Config

#### `getBotConfig()`

Returns a Promise that resolves with the bot's current configuration.

```javascript
config = voiceClient.getBotConfig()
```

### Updating the Bot Config

#### `updateConfig()`

Update the bot's config. Passing a partial config is fine. Only the individual options that are passed to the `updateConfig()` call will be updated. You can omit any services you don't want to make changes to. You can omit any options within a service that you don't want to change.

Returns a Promise that resolves with the full updated configuration.

```javascript
new_config = voiceClient.updateConfig([
  { service: "vad", options:[{stop_secs: 0.5}] }
])
```

### Retrieving Available Config Options

#### `describeConfig()`

Get the available config options for the bot the client is connected to.

Returns a Promise that resolves with the bot's configuration description.

```javascript
configuration_metadescription = await voiceClient.describeConfig()
```

### Server-Side Configuration

Platforms implementing RTVI on the server side will generally provide a method for passing a config into a "start" method. It's a good practice to use the same config format for both client-side and server-side configuration, though of course this choice is left up to the implementor of the server-side APIs.

### Setting Service API Keys

It's important to note that API keys should never be included in configuration messages from or to clients. Clients shouldn't have access to API keys at all.

Platforms implementing RTVI should use a separate mechanism for passing API keys to a bot. A typical approach is to start a bot with a larger, "meta config" that includes API keys, a list of services the bot should instantiate, the client-visible bot configuration, and perhaps other fields like the maximum session duration.

For example:

```javascript
const bot_start_rest_api_payload = {
  api_keys: api_keys_map_for_env,
  bot_profile: "a_bot_version_and_capabilities_string",
  max_duration: duration_in_seconds,
  services: [{ llm: "together", tts: "cartesia" }],
  config: config_passed_from_client
};
```

This approach ensures that sensitive API keys are handled securely and separately from the client-side configuration.

## Actions

### Overview

Actions are service-specific messages dispatched to the bot to trigger specific pipeline behaviors. They provide a flexible mechanism for extending bot functionality without modifying the client directly.

### Key Characteristics of Actions

- **Service-Specific**: Tied to particular services within the bot
- **Non-Event Triggering**: Do not trigger callbacks or events
- **Promise-Based**: Return a Promise that resolves when the bot processes the action

### Common Action Examples

- `tts:say` - Speak a message using text-to-speech
- `tts:interrupt` - Interrupt the current text-to-speech message
- `llm:append_to_messages` - Append context to current LLM messages

### Obtaining Available Actions

To retrieve a list of available actions, use the `describeActions()` method:

```typescript
const actions = await voiceClient.describeActions();
```

#### Action Description Response

```json
{
  "label": "rtvi-ai",
  "type": "actions-available",
  "id": "UNIQUE_ID_FROM_REQUEST",
  "data": {
    "actions": [
      {
        "service": "tts",
        "action": "say",
        "arguments": [
          { "name": "text", "type": "string" },
          { "name": "interrupt", "type": "bool" }
        ]
      }
    ]
  }
}
```

### Action Object Structure

An action object contains:
- `service`: The service the action belongs to
- `action`: Name of the specific action
- `arguments`: Array of accepted argument objects

### Dispatching an Action

```typescript
const someAction = await voiceClient.action({
  service: "tts",
  action: "say",
  arguments: [
    { name: "text", value: "Hello, world!" },
    { name: "interrupt", value: false }
  ]
});
```

### Action Response Handling

#### Successful Response

```json
{
  "label": "rtvi-ai",
  "type": "action-response",
  "id": "UNIQUE_ID_FROM_REQUEST",
  "data": {
    "result": "Hello, world!"
  }
}
```

#### Error Handling Strategies

1. Using `try/catch`:
```typescript
try {
  const someAction = await voiceClient.action({...});
} catch(e) {
  console.error(e);
}
```

2. Using `onMessageError` callback
3. Listening for `MessageError` event

### Best Practices

- Always handle potential errors when dispatching actions
- Use `describeActions()` to dynamically discover available actions
- Understand the specific arguments required for each action
- Leverage actions to extend bot functionality without client modifications

## Messages

### Overview

Messages are a flexible communication mechanism between clients and bots, differing from actions in several key aspects:

- **Not Service-Specific**: Can be used across different services
- **No Promise Return**: Do not return a Promise
- **Callback Driven**: Typically result in a callback or event

### Key Characteristics

- Arbitrary data can be sent between client and bot
- Used for passing instructions or configuration
- "Fire and forget" communication style

### Common Message Examples

- `updateConfig`: Update bot configuration
- `describeConfig`: Request current configuration
- `describeActions`: List available actions

### Sending Messages

#### `sendMessage()` Method

The `sendMessage()` method is a "fire and forget" function for sending messages to a bot:

```typescript
voiceClient.sendMessage(message);
```

#### Message Anatomy

```typescript
{
  label: "rtvi-ai",
  type: "EVENT_TYPE",
  data: { EVENT_TYPE_DATA }
}
```

#### Example Message Dispatch

```typescript
voiceClient.sendMessage({
  label: "rtvi-ai",
  type: "myMessage",
  data: {
    "hello": "world"
  }
});
```

### Advanced Usage

#### Custom Message Handling

Developers can extend message handling by:
- Extending `VoiceClient` with a custom class
- Building helper methods for specific message types
- Creating custom message handlers

### Transport Layer Responsibilities

The transport layer manages:
- Packing and unpacking messages
- Sending messages over the network
- Delivering messages to the SDK
- Emitting corresponding events

### Best Practices

- Use messages for configuration and non-service-specific communications
- Implement robust error handling for message dispatches
- Keep message payloads lightweight and focused
- Leverage existing message types before creating custom ones
- Document custom message types and their expected behaviors

### Comparison with Actions

| Characteristic | Messages | Actions |
|---------------|----------|---------|
| Service Specificity | Across services | Service-specific |
| Return Value | None | Promise |
| Use Case | Configuration, instructions | Specific service operations |
| Callback Trigger | Yes | No |

## Errors

### Overview

RTVI Voice Client defines a set of specific error types to handle various potential failure scenarios during bot interactions. These errors provide detailed information to help developers diagnose and handle different types of issues.

### Base Error: `VoiceError`

The foundational error type for all RTVI Voice Client errors.

#### Properties
- `status`: `number` - Unique identifier or HTTP status code
- `message`: `string` - Detailed explanation of the error

### Error Types

#### 1. `ConnectionTimeoutError`

**Occurs when**: Bot fails to enter a ready state within the specified timeout.

**Characteristics**:
- Indicates connection establishment failure
- Triggered when bot initialization takes longer than expected

#### 2. `StartBotError`

**Occurs when**: Invalid response from the base URL route.

**Properties**:
- `status`: Returned HTTP status code
- `message`: Verbose error message
- `error`: Error type (defaults to `invalid-request-error`)

**Common Causes**:
- Base URL unavailable
- Configuration parsing failure
- Invalid endpoint response

#### 3. `TransportStartError`

**Occurs when**: Transport layer cannot establish a connection.

**Typical Scenarios**:
- Invalid authentication bundle
- Network connectivity issues
- Incorrect transport configuration

#### 4. `ConfigUpdateError`

**Occurs when**: Bot cannot parse provided configuration properties.

**Potential Reasons**:
- Malformed configuration object
- Missing required configuration parameters
- Type mismatches in configuration values

#### 5. `BotNotReadyError`

**Occurs when**: Client attempts a voice client action that requires the bot to be in a ready state.

**Common Scenarios**:
- Calling methods before bot initialization
- Attempting actions during bot startup or shutdown
- Premature interaction with uninitialized bot services

### Error Handling Strategies

#### Basic Error Handling

```typescript
try {
  await voiceClient.startBot();
} catch (error) {
  if (error instanceof ConnectionTimeoutError) {
    console.error('Bot connection timed out');
    // Implement reconnection logic
  } else if (error instanceof StartBotError) {
    console.error('Failed to start bot:', error.message);
    // Handle specific start bot failures
  }
}
```

#### Comprehensive Error Handling

```typescript
voiceClient.on('error', (error) => {
  switch (error.constructor) {
    case ConnectionTimeoutError:
      // Handle connection timeout
      break;
    case StartBotError:
      // Handle bot start failures
      break;
    case TransportStartError:
      // Handle transport connection issues
      break;
    case ConfigUpdateError:
      // Handle configuration errors
      break;
    case BotNotReadyError:
      // Handle premature bot interactions
      break;
    default:
      // Handle unknown errors
  }
});
```

### Best Practices

- Always implement comprehensive error handling
- Log detailed error information for debugging
- Provide user-friendly error messages
- Implement retry mechanisms for transient errors
- Use type-specific error handling when possible

### Error Prevention

- Validate configurations before bot initialization
- Check bot readiness state before performing actions
- Implement proper timeout and retry mechanisms
- Use type guards and instanceof checks for precise error handling

### Debugging Tips

- Enable verbose logging for detailed error context
- Use error tracking and monitoring tools
- Implement graceful degradation strategies
- Provide clear error messages to end-users

## Helpers

### Introduction

Helpers are powerful extensions that provide additional ways to interact with your bot pipeline. They offer a standardized interface for working with transports, events, and messages within specific service contexts.

#### Key Characteristics

- **Extensibility**: Reduce unnecessary functionality in voice clients
- **Service-Specific**: Target specific services or workflows
- **Flexible**: Facilitate custom convenience functions

#### Common Use Cases

- LLM message context modification
- Direct text-to-speech output
- Multi-lingual workflows
- Custom service-specific interactions

### Importing and Defining Helpers

#### Example: LLM Helper

```typescript
import {
  LLMHelper,
  LLMHelperEvent,
  VoiceMessage,
} from "realtime-ai";

const voiceClient = new VoiceClient({
  services: {
    llm: "openai"
  },
  config: [
    // ...
  ]
});

const llmHelper = new LLMHelper({
  callbacks: {
    onLLMContextUpdate: (messages) => {
      // Custom context update logic
    }
  }
});

// Register the helper
voiceClient.registerHelper("llm", llmHelper);

// Listen to helper events
voiceClient.on(LLMHelperEvent.LLMContextUpdate, (messages) => {
  console.log(messages);
});

// Use helper methods
await llmHelper.appendContext({
  role: "user",
  content: "Tell me a joke!",
});
```

### Helper Management

#### Registering a Helper

```typescript
voiceClient.registerHelper(service, helper);
```

**Parameters**:
- `service`: String identifying the target service
- `helper`: Instance of `VoiceClientHelper`

**Notes**:
- Requires a matching service in the voice client constructor
- Supports multiple service instances

#### Retrieving a Helper

```typescript
const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
```

#### Unregistering a Helper

```typescript
voiceClient.unregisterHelper("llm");
```

**Cautions**:
- Unregistering does not delete local references
- Subsequent uses will raise exceptions
- Registering a new helper with the same service name may cause errors

### Message Handling

#### Helper Message Processing

```typescript
public handleMessage(ev: VoiceMessage): void {
  switch(ev.type) {
    case MyHelperMessageType.SOME_MESSAGE:
      this._options.callbacks.onSomeMessage(ev.data);
      break;
  }
}
```

**Best Practices**:
- Implement comprehensive message type handling
- Be cautious with 'default' switch handlers
- Prevent message interception by lower-order helpers

### Creating Custom Helpers

#### Basic Helper Structure

```typescript
import { 
  VoiceMessage,
  VoiceClientHelper,
  VoiceClientHelperOptions
} from "realtime-ai";

// Define Events
export enum MyHelperEvents {
  SomeEvent = "some-event",
}

// Define Message Types
export enum MyHelperMessageType {
  SOME_MESSAGE = "some-message",
}

// Define Callbacks
export type MyHelperCallbacks = Partial<{
  onSomeMessage: (message) => void;
}>;

// Helper Options Interface
export interface MyHelperOptions extends VoiceClientHelperOptions {
  callbacks?: MyHelperCallbacks;
}

// Custom Helper Class
export class MyCustomHelper extends VoiceClientHelper {
  protected declare _options: MyHelperOptions;

  constructor(options: MyHelperOptions) {
    super(options);
  }

  public handleMessage(ev: VoiceMessage): void {
    switch (ev.type) {
      case MyHelperMessageType.SOME_MESSAGE:
        // Handle message
        break;
    }
  }

  public getMessageTypes(): string[] {
    return Object.values(MyHelperMessageType) as string[];
  }
}
```

### Advanced Helper Techniques

#### Multi-Service Helpers
- Design helpers that can work across multiple service types
- Implement flexible callback and event handling
- Use type guards and service detection

#### Performance Considerations
- Keep helper logic lightweight
- Minimize blocking operations
- Use async methods for complex logic

### Best Practices

- Keep helpers focused and service-specific
- Implement comprehensive error handling
- Use TypeScript for type safety
- Document helper functionality thoroughly
- Consider performance and scalability
- Leverage existing helpers before creating custom ones

### Common Pitfalls

- Overcomplicating helper logic
- Ignoring error cases
- Not handling message types comprehensively
- Creating helpers with too broad a scope

### Debugging Helpers

- Add verbose logging
- Implement comprehensive error tracking
- Use TypeScript's strict mode
- Write unit tests for helper methods

## LLM Helper

### Overview

The RTVI Client Web includes a specialized LLM (Large Language Model) helper designed to streamline typical LLM tasks and workflows. This helper provides a robust set of methods for managing and interacting with language models.

### Initialization and Setup

```typescript
import { VoiceClient, LLMHelper } from "realtime-ai";

const voiceClient = new VoiceClient({
  services: {
    llm: "openai", // Specify LLM provider
  },
});

const llmHelper = new LLMHelper({
  callbacks: {
    // Optional callback configurations
  }
});

// Register the helper with the voice client
voiceClient.registerHelper("llm", llmHelper);
```

### LLM Helper Actions

#### Key Characteristics
- All actions are abstracted and Promise-based
- Can be awaited or chained with `.then()`
- Trigger `onMessageError` callback on processing failures

### 1. `getContext()`

**Action**: `llm:get_context`

**Description**: Retrieve the current LLM context from the bot.

**Returns**: `Promise<LLMContext>`

```typescript
const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
const ctx = await llmHelper.getContext();

// Example return value
// {
//   messages?: LLMContextMessage[];
//   tools?: [];
// }
```

### 2. `setContext()`

**Action**: `llm:set_context`

**Description**: Replace the current LLM context with a new one.

**Parameters**:
- `context`: `LLMContext` (Required)
- `interrupt`: `boolean` (Optional, default: `false`)
  - Interrupt current conversation and apply new context immediately

**Returns**: `Promise<boolean>`

```typescript
await llmHelper.setContext(
  {
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant",
      },
      {
        role: "user",
        content: "Tell me a joke",
      },
    ],
  },
  false // or true to interrupt
);

// Returns true if successful, false on error
```

### 3. `appendToMessages()`

**Action**: `llm:append_to_messages`

**Description**: Append a new message to the existing context.

**Parameters**:
- `context`: `LLMContextMessage` (Required)
- `runImmediately`: `boolean` (Optional, default: `false`)
  - Apply new message immediately or wait until current turn concludes

**Returns**: `Promise<boolean>`

```typescript
await llmHelper.appendToMessages(
  {
    role: "user",
    content: "Tell me a joke",
  },
  false // or true to run immediately
);

// Returns true if successful, false on error
```

### Callbacks and Events

#### Available Callbacks

```typescript
interface LLMHelperCallbacks {
  onLLMJsonCompletion: (jsonString: string) => void;
  onLLMFunctionCall: (func: LLMFunctionCallData) => void;
  onLLMFunctionCallStart: (functionName: string) => void;
  onLLMMessage: (message: LLMContextMessage) => void;
}
```

### Advanced Usage Examples

#### Comprehensive Context Management

```typescript
// Get current context
const currentContext = await llmHelper.getContext();

// Modify and set new context
const newContext = {
  ...currentContext,
  messages: [
    ...currentContext.messages,
    { role: "user", content: "Explain quantum computing" }
  ]
};
await llmHelper.setContext(newContext, true);

// Append message
await llmHelper.appendToMessages(
  { role: "assistant", content: "Quantum computing is..." }
);
```

### Best Practices

- Always handle potential errors when using LLM helper methods
- Use `interrupt` and `runImmediately` flags judiciously
- Implement comprehensive error handling
- Leverage callbacks for advanced interaction tracking

### Common Patterns

- Maintaining conversational context
- Implementing multi-turn interactions
- Dynamically updating system prompts
- Handling complex conversational flows

### Debugging and Monitoring

- Use callbacks to log and track LLM interactions
- Implement error handling for message processing
- Monitor context changes and message appends
- Log function call starts and completions

### Limitations and Considerations

- Context size limitations may vary by provider
- Performance can depend on LLM provider configuration
- Some actions may have provider-specific behaviors

## Callbacks and Events

### Configuring Callbacks

A voice client exposes callback hooks that can be defined on the constructor:

```javascript
const voiceClient = new VoiceClient({
  // ...
  callbacks: {
    onBotReady: bot_ready_handler_func,
  },
});
```

### Callback Categories

#### State and Connectivity

1. **`onTransportStateChanged(state: TransportState)`**
   - Provides a TransportState string representing the connectivity state of the local client.
   - Possible states: `idle` | `initializing` | `initialized` | `authenticating` | `connecting` | `connected` | `ready` | `disconnected` | `error`

2. **`onConnected()`**
   - Local user successfully established a connection to the transport.

3. **`onDisconnected()`**
   - Local user disconnected from the transport, either intentionally or due to an error.

4. **`onBotConnected()`**
   - Bot connected to the transport and is configuring.
   - Note: Bot connectivity does not infer that its pipeline is ready to run.

5. **`onBotReady(botReadyData: BotReadyData)`**
   - The bot has been instantiated, its pipeline is configured, and it is receiving user media and interactions.
   - Passed a `BotReadyData` object containing:
     - `config`: VoiceClientConfigOption[] array
     - RTVI version number
   - Recommended to hydrate the client with the passed config.

6. **`onBotDisconnected()`**
   - Bot disconnected from the transport.
   - May occur due to session expiry, pipeline error, or local participant leaving.

#### Messages and Errors

1. **`onGenericMessage(data: unknown)`**
   - Handles unknown message types from the transport.

2. **`onMessageError(message: VoiceMessage)`**
   - Handles response errors when an action fails.

3. **`onError(message: VoiceMessage)`**
   - Signals errors from the bot (e.g., malformed config update).

#### Configuration

1. **`onConfigUpdated(config: VoiceClientConfigOption[])`**
   - Triggered when the bot's configuration changes.
   - Recommended to hydrate the client config with the passed config.

2. **`onConfigDescribe(configDescription: unknown)`**
   - Lists available configuration options for each service.
   - Example structure:
     ```json
     {
       "config": [
         {
           "service": "llm",
           "options": [
             { "name": "model", "type": "string" },
             { "name": "messages", "type": "array" }
           ]
         },
         {
           "service": "tts",
           "options": [
             { "name": "voice", "type": "string" }
           ]
         }
       ]
     }
     ```

#### Media and Devices

1. **`onAvailableMicsUpdated(mics: MediaDeviceInfo[])`**
   - Lists available local microphone devices.

2. **`onAvailableCamsUpdated(cams: MediaDeviceInfo[])`**
   - Lists available local camera devices.

3. **`onMicUpdated(mic: MediaDeviceInfo)`**
   - User selected a new microphone.

4. **`onCamUpdated(cam: MediaDeviceInfo)`**
   - User selected a new camera.

#### Audio and Voice Activity

1. **`onTrackStarted(track: MediaStreamTrack, participant: Participant)`**
   - Media track from a local or remote participant started.

2. **`onTrackStopped(track: MediaStreamTrack, participant: Participant)`**
   - Media track from a local or remote participant stopped.

3. **`onLocalAudioLevel(level: number)`**
   - Local audio gain level (0 to 1).

4. **`onRemoteAudioLevel(level: number, participant: Participant)`**
   - Remote audio gain level (0 to 1).

5. **Voice Activity Detection**
   - `onBotStartedSpeaking()`
   - `onBotStoppedSpeaking()`
   - `onUserStartedSpeaking()`
   - `onUserStoppedSpeaking()`

#### Transcription

1. **`onUserStoppedSpeaking(transcript: Transcription)`**
   - Transcribed local user input.

2. **`onBotTranscript(transcript: string)`**
   - Transcribed bot input.

#### Other

1. **`onMetrics(data: PipecatMetrics)`**
   - Pipeline data from Pipecat.

### Standard Events

RTVI defines standard events that map to messages/actions:

```typescript
enum VoiceEvent {
  MessageError = "messageError",
  Error = "error",
  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "transportStateChanged",
  ConfigUpdated = "configUpdated",
  ConfigDescribe = "configDescribe",
  ActionsAvailable = "actionsAvailable",
  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",
  AvailableCamsUpdated = "availableCamsUpdated",
  AvailableMicsUpdated = "availableMicsUpdated",
  CamUpdated = "camUpdated",
  MicUpdated = "micUpdated",
  BotConnected = "botConnected",
  BotReady = "botReady",
  BotDisconnected = "botDisconnected",
  BotStartedSpeaking = "botStartedSpeaking",
  BotStoppedSpeaking = "botStoppedSpeaking",
  RemoteAudioLevel = "remoteAudioLevel",
  UserStartedSpeaking = "userStartedSpeaking",
  UserStoppedSpeaking = "userStoppedSpeaking",
  LocalAudioLevel = "localAudioLevel",
  Metrics = "metrics",
  UserTranscript = "userTranscript",
  BotTranscript = "botTranscript",
  LLMFunctionCall = "llmFunctionCall",
  LLMFunctionCallStart = "llmFunctionCallStart",
  LLMJsonCompletion = "llmJsonCompletion"
}
```

### Binding and Unbinding Event Handlers

```javascript
import { VoiceEvent } from "realtime-ai";

function handleBotReady() {
  console.log("Bot is ready!");
}

// Bind an event handler
voiceClient.on(VoiceEvent.BotReady, handleBotReady);
// or
voiceClient.on("botReady", handleBotReady);

// Unbind an event handler
voiceClient.off(VoiceEvent.BotReady, handleBotReady);
