# DailyBots Server Reference: Bot Profiles

## Bot Profile Overview

When initiating a bot via the `/bots/start` request, you must specify a `bot_profile`. This profile corresponds to a pre-defined Pipecat pipeline of services, each designed for specific conversational scenarios.

### Supported Bot Profiles

| Bot Type | Configuration String | Description | Configurable Services |
|----------|---------------------|-------------|----------------------|
| Voice AI (Standard) | `voice_2024_10`, `voice_2024_08` | Voice-only conversational bot | STT, LLM, TTS |
| Voice AI (Natural) | `natural_conversation_2024_11` | Naturally conversational bot with advanced turn-taking | STT, LLM, TTS |
| Vision And Voice | `vision_2024_10`, `vision_2024_08` | Bot that can see and respond to user | STT, LLM, TTS |
| OpenAI Realtime | `openai_realtime_beta_2024_10` | Speech-to-speech bot using OpenAI's Realtime API | LLM |
| Twilio Websocket | `twilio_ws_voice_2024_09` | Voice bot over Twilio WebSocket | STT, LLM, TTS |

## Voice AI Profiles

### Overview

Voice AI bot profiles enable conversational AI interactions with two primary variants:

1. **Standard Voice AI**: 
   - Basic conversational interactions
   - Simple turn-taking
   - Straightforward response generation

2. **Natural Voice AI**:
   - Enhanced natural dialogue
   - Improved context awareness
   - More nuanced turn-taking mechanisms

### Common Requirements
- Speech-to-Text (STT) configuration
- Language Model (LLM) configuration
- Text-to-Speech (TTS) configuration

### Example Request: Standard Voice AI

```bash
curl --location --request POST 'https://api.daily.co/v1/bots/start' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $DAILY_API_KEY' \
--data '{
  "bot_profile": "voice_2024_10",
  "max_duration": 300,
  "services": {
    "tts": "cartesia",
    "llm": "anthropic"
  },
  "config": [
    {
      "service": "stt",
      "options": [
        {
          "name": "model",
          "value": "nova-2-general"
        },
        {
          "name": "language",
          "value": "en"
        }
      ]
    },
    {
      "service": "tts",
      "options": [
        {
          "name": "voice",
          "value": "79a125e8-cd45-4c13-8a67-188112f4dd22"
        }
      ]
    },
    {
      "service": "llm",
      "options": [
        {
          "name": "model",
          "value": "claude-3-5-sonnet-latest"
        },
        {
          "name": "initial_messages",
          "value": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": "You are an assistant called Daily Bot. You can ask me anything. Keep responses brief and legible. Introduce yourself first."
                }
              ]
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
}'
```

## Vision And Voice Profile

### Overview

The Vision and Voice bot profile represents an advanced conversational AI with visual perception capabilities.

### Key Characteristics
- Requires camera attachment
- Processes video frames to inform responses
- Supports same services as Voice AI profile
- Adds visual context to interactions

### Requirements
- Camera service enabled
- `enableCam` set to `true` in RTVIClient
- Video frame transmission capability

### Example Request

```bash
curl --location --request POST 'https://api.daily.co/v1/bots/start' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $DAILY_API_KEY' \
--data '{
  "bot_profile": "vision_2024_10",
  "max_duration": 300,
  "services": {
    "tts": "cartesia",
    "llm": "anthropic"
  },
  "config": [
    {
      "service": "stt",
      "options": [
        {
          "name": "model",
          "value": "nova-2-general"
        },
        {
          "name": "language",
          "value": "en"
        }
      ]
    },
    {
      "service": "tts",
      "options": [
        {
          "name": "voice",
          "value": "79a125e8-cd45-4c13-8a67-188112f4dd22"
        }
      ]
    },
    {
      "service": "llm",
      "options": [
        {
          "name": "model",
          "value": "claude-3-5-sonnet-latest"
        },
        {
          "name": "initial_messages",
          "value": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": "You are an assistant called Daily Bot. You can see and interact with the user. Keep responses brief and legible."
                }
              ]
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
}'
```

## Twilio WebSocket Voice AI

### Overview

The Twilio WebSocket bot profile enables voice communication through Twilio's WebSocket API.

### Key Characteristics
- Voice-only conversational bot
- Communicates via Twilio WebSocket
- Requires standard Voice AI service configurations

### Additional Configuration
- Refer to Twilio WebSocket service tutorial for specific setup

## OpenAI Realtime Profile

### Overview

A specialized bot profile leveraging OpenAI's Realtime API for speech-to-speech interactions.

### Unique Characteristics
- Focuses primarily on LLM configuration
- Simplified service requirements
- Experimental/Beta status

## Best Practices

1. Choose the most appropriate bot profile for your use case
2. Carefully configure all required services
3. Test thoroughly with different configurations
4. Monitor bot performance and interactions
5. Be mindful of service and model compatibility

## Troubleshooting

- Verify API keys and authentication
- Check service configurations
- Ensure compatible models and services
- Review error messages from `/bots/start` endpoint
- Validate network and connectivity settings

## References

- [Supported Services Documentation](#supported-services)
- [Twilio WebSocket Tutorial](link-to-tutorial)
- [OpenAI Realtime API Documentation](link-to-openai-docs)

## Service Options

### Overview

Service options are configuration settings applied during service initialization that typically remain constant throughout a session. These options define fundamental characteristics of a service, such as:

- LLM model selection
- Speech-to-Text language configuration
- Text-to-Speech sample rate
- Base URLs for service endpoints

### Key Characteristics

- Set at service initialization
- Generally not changed during the session
- Provide core configuration for each service
- Defined in the `/bots/start` endpoint payload

### Service Options Structure

```json
{
  "service_options": {
    "<service name>": {
      "<option name>": "<option value>"
    },
    "<service name>": {
      "<option1 name>": "<option1 value>",
      "<option2 name>": "<option2 value>"
    }
  }
}
```

### Example Configurations

#### Text-to-Speech (TTS) Service Options

```json
{
  "service_options": {
    "openai_tts": {
      "sample_rate": 24000,
      "voice": "alloy"
    }
  }
}
```

#### Language Model (LLM) Service Options

```json
{
  "service_options": {
    "anthropic": {
      "base_url": "https://api.anthropic.com/v1",
      "api_version": "2023-06-01"
    },
    "openai": {
      "organization_id": "org-123456",
      "model": "gpt-4-turbo"
    }
  }
}
```

#### Speech-to-Text (STT) Service Options

```json
{
  "service_options": {
    "deepgram": {
      "language": "en-US",
      "model": "nova-2",
      "punctuate": true
    }
  }
}
```

### Common Service Options by Type

#### Text-to-Speech (TTS)
- `sample_rate`: Audio output sampling frequency
- `voice`: Specific voice identifier
- `model`: TTS model selection
- `speaking_rate`: Speech tempo

#### Language Model (LLM)
- `model`: Specific model version
- `base_url`: Custom API endpoint
- `api_version`: Service API version
- `temperature`: Response creativity
- `max_tokens`: Response length limit

#### Speech-to-Text (STT)
- `language`: Transcription language
- `model`: Transcription model
- `punctuate`: Punctuation handling
- `profanity_filter`: Explicit content filtering

### Best Practices

1. Choose service options carefully during initialization
2. Align options with your specific use case
3. Consider performance and cost implications
4. Validate option compatibility with chosen service
5. Document your service configurations

### Debugging and Validation

- Verify service option support with provider documentation
- Use provider-specific validation tools
- Check API compatibility
- Monitor service performance with different configurations

### Common Pitfalls

- Misconfiguring critical service parameters
- Using unsupported option combinations
- Neglecting to set required options
- Overlooking service-specific constraints

### Advanced Configuration

#### Dynamic Service Option Management
- Some services support partial configuration updates
- Consult individual service documentation
- Use `updateConfig()` methods when available

### References

- [Supported Services Documentation](#supported-services)
- Individual Service Provider Documentation
  - [Anthropic API Docs](link-to-anthropic)
  - [OpenAI API Docs](link-to-openai)
  - [Deepgram API Docs](link-to-deepgram)

### Troubleshooting

- Review error messages from `/bots/start` endpoint
- Validate service option compatibility
- Check API key and authentication
- Ensure network connectivity
- Compare configurations with service documentation

## Supported Services

### Services Overview

Daily Bots are built on top of Pipecat, an Open Source framework for integrating various services such as:
- Text-to-Speech (TTS)
- Language Models (LLM)
- Speech-to-Text (STT)

#### Key Characteristics
- Pre-configured "bot profiles" for common service combinations
- Flexible service provider selection
- Option to use integrated or bring-your-own API keys
- Transparent pricing model

### Service Provider Categories

#### 1. Speech-to-Text (STT) Providers

| Provider | Configuration String | Integrated | Supported Models |
|----------|---------------------|------------|-----------------|
| Deepgram | `"deepgram"` | Yes | Any listed in Deepgram documentation |
| AssemblyAI | `"assemblyai"` | No | N/A |
| Gladia | `"gladia"` | No | N/A |

##### Configuration Considerations
- Deepgram is the primary integrated STT provider
- Non-English language support available
- Bring Your Own (BYO) API key option for alternative providers

#### 2. Language Model (LLM) Providers

| Provider | Configuration String | Integrated | Supported Models |
|----------|---------------------|------------|-----------------|
| Anthropic | `"anthropic"` | Yes | - claude-3-5-sonnet-20240620<br>- claude-3-5-sonnet-20241022<br>- claude-3-5-sonnet-latest<br>- claude-3-5-haiku-20241022<br>- claude-3-5-haiku-latest |
| Together AI | `"together"` | Yes | - meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo<br>- meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo<br>- meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo<br>- meta-llama/Llama-3.2-3B-Instruct-Turbo<br>- meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo<br>- meta-llama/Llama-3.2-90B-Instruct-Turbo |
| Google Gemini | `"gemini"` | No | Any listed in Gemini documentation |
| Grok | `"grok"` | No | Any listed in Grok documentation |
| Groq | `"groq"` | No | Any listed in Groq documentation |
| OpenAI | `"openai"` | No | Any listed in OpenAI documentation |
| Custom LLM | `"custom_llm"` | No | OpenAI spec compliant LLMs |

##### Configuration Considerations
- Integrated providers: Anthropic and Together AI
- Extensive model selection
- Compatibility with OpenAI-spec LLMs
- BYO API key supported

#### 3. Text-to-Speech (TTS) Providers

| Provider | Configuration String | Integrated | Supported Models |
|----------|---------------------|------------|-----------------|
| Cartesia | `"cartesia"` | Yes | - "sonic-english"<br>- "sonic-multilingual" |
| Deepgram TTS | `"deepgram_tts"` | Yes | Any listed in Deepgram documentation |
| ElevenLabs | `"elevenlabs"` | Yes | - eleven_turbo_v2_5<br>- eleven_turbo_v2 |
| Azure | `"azure_tts"` | No | Any listed in Azure documentation |
| AWS | `"aws_tts"` | No | Any listed in AWS documentation |
| Google | `"google_tts"` | No | Any listed in Google documentation |
| OpenAI | `"openai_tts"` | No | - "tts-1"<br>- "tts-1-hd" |
| PlayHT | `"playht"` | No | - Play3.0-mini<br>- PlayHT2.0-turbo<br>- PlayHT2.0 |
| Rime | `"rime"` | No | - mist<br>- v1 |

##### Configuration Considerations
- Multiple integrated providers
- Wide range of voice and language options
- BYO API key for non-integrated providers

#### 4. Speech-to-Speech Providers

| Provider | Configuration String | Integrated | 
|----------|---------------------|------------|
| OpenAI Realtime | `"openai_realtime"` | No | N/A |

##### Configuration Considerations
- Currently limited to OpenAI Realtime
- Expanding provider list in future updates

#### 5. Transport Provider

| Provider | Configuration String | Integrated | 
|----------|---------------------|------------|
| Daily | Default | Yes |

### Best Practices

1. **Provider Selection**
   - Choose providers based on:
     - Language requirements
     - Voice characteristics
     - Model capabilities
     - Cost considerations

2. **API Key Management**
   - Securely store API keys
   - Use environment variables
   - Rotate keys periodically
   - Monitor usage and costs

3. **Performance Optimization**
   - Select models appropriate for your use case
   - Consider model size and inference speed
   - Test different providers and models

### Pricing and Cost

- Integrated providers: Daily passes on the cost to you
- BYO API key: Cost depends on your provider's pricing
- Detailed pricing available on Daily Bots pricing page

### Future Roadmap

- Expanding provider list
- Adding more integrated services
- Improving model selection
- Enhancing cross-provider compatibility

### Getting Help

- Consult documentation for each provider
- Contact Daily Bots support for specific inquiries
- Community forums for troubleshooting

### See Also
- [Pricing Guide](#)
- [BYO API Keys](#)
- [Bot Profiles](#)

## Text-to-Speech (TTS) Services

### Overview

Text-to-Speech (TTS) services in Daily Bots provide advanced audio generation capabilities, allowing you to convert text into natural-sounding speech across multiple providers.

#### Supported TTS Providers
1. AWS Polly
2. Azure
3. Cartesia
4. Deepgram
5. ElevenLabs
6. Google
7. OpenAI
8. PlayHT
9. Rime

### Common Configuration Parameters

#### Service Options
- **`voice`**: Select a specific voice from the provider's library
- **`sample_rate`**: Configure audio output sample rate
  - Typical supported rates: 8000, 16000, 22050, 24000, 44100, 48000
- **`region`**: Specify the service region (provider-specific)

#### Advanced Configuration Options
- **`language`**: Set the language for speech generation
- **`model`**: Choose specific TTS model
- **`text_filter`**: Control markdown, code, and table filtering
  - `enable_text_filter`: Basic filtering
  - `filter_code`: Remove code blocks
  - `filter_tables`: Remove table content

### Text Filtering Best Practices
1. Enable basic text filtering to improve TTS accuracy
2. Use code and table filtering for cleaner speech output
3. Customize filtering based on your specific use case

### Performance Considerations
- Different providers offer varying voice quality and latency
- Model and voice selection impacts speech naturalness
- Some providers offer emotion and style customization

### Security and Compliance
- Most services require API keys
- Use environment variables for secure key management
- Review provider-specific data handling policies

### Recommended Providers
- **Low Latency**: Cartesia, ElevenLabs
- **Multilingual**: Azure, Google
- **Customization**: ElevenLabs, PlayHT

### Troubleshooting
- Verify API key and authentication
- Check network connectivity
- Test different voices and models
- Monitor API usage and costs

## AWS Polly TTS Service

### Overview
[AWS Polly](https://aws.amazon.com/polly) provides high-quality text-to-speech conversion with multiple voices and languages.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `aws_tts`
- **Integration**: Bring Your Own (BYO) Keys

### Service Options
- **`aws_access_key_id`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: AWS Access Key ID for authentication

- **`region`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: AWS region for service access

- **`voice`**
  - **Type**: `string`
  - **Default**: `"Joanna"`
  - **Description**: Select from available AWS Polly voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 22050, 24000, 44100, 48000

### Configuration Options
- **`engine`**: Select TTS engine (neural, standard)
- **`language`**: Specify speech language
- **`pitch`**: Adjust voice pitch
- **`rate`**: Control speech rate
- **`volume`**: Modify audio volume

### Example Configuration
```json
{
  "service_options": {
    "aws_tts": {
      "aws_access_key_id": "$YOUR_AWS_ACCESS_KEY_ID",
      "region": "us-west-2",
      "voice": "Amy"
    }
  }
}
```

### Best Practices
1. Use neural engine for more natural speech
2. Match voice to content context
3. Test different voices and settings

### See Also
- [AWS Polly Documentation](https://docs.aws.amazon.com/polly/)

## Azure TTS Service

### Overview
[Azure](https://azure.microsoft.com/en-us/products/ai-services/ai-speech) offers advanced text-to-speech capabilities with neural voices.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `azure_tts`
- **Integration**: Bring Your Own (BYO) Keys

### Service Options
- **`region`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: Azure region for service access

- **`voice`**
  - **Type**: `string`
  - **Default**: `"en-US-SaraNeural"`
  - **Description**: Select from available Azure TTS voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 22050, 24000, 32000, 44100, 48000

### Advanced Configuration
- **`role`**: Specify speaking role (age, gender)
- **`style`**: Adjust speaking style
- **`style_degree`**: Fine-tune style intensity
- **`emphasis`**: Control speech emphasis

### Example Configuration
```json
{
  "service_options": {
    "azure_tts": {
      "region": "eastus",
      "voice": "en-US-BrianNeural"
    }
  }
}
```

### Multilingual Support
- Extensive language and voice options
- Use `sonic-multilingual` model for non-English languages

### See Also
- [Azure Speech Services](https://azure.microsoft.com/en-us/products/ai-services/ai-speech)

## Cartesia TTS Service

### Overview
[Cartesia](https://cartesia.ai) provides low-latency, expressive text-to-speech with emotion control.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `cartesia`
- **Integration**: Fully Integrated

### Service Options
- **`voice`**
  - **Type**: `string`
  - **Default**: `"79a125e8-cd45-4c13-8a67-188112f4dd22"`
  - **Description**: Select from available Cartesia voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 22050, 24000, 44100, 48000

### Configuration Options
- **`model`**: Choose speech model (English, Multilingual)
- **`language`**: Specify speech language
- **`speed`**: Control speech rate
- **`emotion`**: Add emotional nuance to speech

### Emotion Configuration
- Supported emotions: anger, positivity, surprise, sadness, curiosity
- Emotion levels: lowest, low, high, highest

### Example Configuration
```json
{
  "service_options": {
    "cartesia": {
      "voice": "820a3788-2b37-4d21-847a-b65d8a68c99a",
      "model": "sonic-english"
    }
  }
}
```

### See Also
- [Cartesia Sonic](https://cartesia.ai/sonic)

## Daily Transport Service

### Overview
[Daily](https://www.daily.co) provides the core transport service for Daily Bots, enabling real-time communication and advanced audio management.

#### Service Details
- **Service Type**: Transport
- **Configuration Key**: `"daily"`
- **Integration Status**: Fully Integrated

### Service Options

#### Noise Cancellation
- **Parameter**: `enable_noise_cancellation`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Eliminate background sounds from audio streams
- **Benefits**:
  - Improves voice recognition accuracy
  - Reduces audio interruptions
  - Enhances overall communication quality
- **Example**:
  ```json
  {
    "service_options": {
      "daily": {
        "enable_noise_cancellation": true
      }
    }
  }
  ```

#### Participant Management
- **Parameter**: `mute_on_third_participant_join`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Automatically mute bot when a third participant joins
- **Use Cases**:
  - Facilitating human handoff
  - Managing bot interaction protocols
- **Example**:
  ```json
  {
    "service_options": {
      "daily": {
        "mute_on_third_participant_join": true
      }
    }
  }
  ```

### Best Practices

1. **Noise Management**
   - Enable noise cancellation for clearer audio
   - Test audio quality in various environments
   - Adjust sensitivity based on specific use cases

2. **Participant Interaction**
   - Configure mute settings to align with bot's purpose
   - Implement clear handoff protocols
   - Consider user experience when managing bot interactions

### Performance Considerations
- Noise cancellation may introduce slight audio processing latency
- Mute settings can impact bot's conversational flow
- Test thoroughly in different communication scenarios

### Potential Limitations
- Noise cancellation effectiveness varies by audio environment
- Mute settings may interrupt bot's primary function

### Troubleshooting
- Verify audio input and output settings
- Check microphone and audio device configurations
- Monitor bot's interaction capabilities

## Recordings Endpoint

### Overview
The Recordings endpoint allows retrieval of cloud recordings for your Daily domain.

### Endpoint Details
- **Method**: `GET`
- **Path**: `/recordings`

### Authentication
- **Type**: Bearer Authentication
- **Header**: `Authorization: Bearer <token>`
- **Token**: Your authentication token

### Query Parameters

#### Pagination and Filtering
- **`limit`**
  - **Type**: `integer`
  - **Description**: Maximum number of recordings to return
  - **Constraints**: 1 < x < 100
  - **Default**: 100

- **`starting_after`**
  - **Type**: `string`
  - **Description**: Pagination cursor for forward pagination
  - **Usage**: Retrieve recordings after a specific recording ID

- **`ending_before`**
  - **Type**: `string`
  - **Description**: Pagination cursor for backward pagination
  - **Usage**: Retrieve recordings before a specific recording ID

### Response Structure

#### Top-Level Response
- **`total_count`**
  - **Type**: `integer`
  - **Description**: Total number of recordings stored

- **`data`**
  - **Type**: `array of objects`
  - **Description**: List of recording details

#### Recording Object Details
- **`id`**
  - **Type**: `string`
  - **Description**: Unique, opaque ID for the recording

- **`room_name`**
  - **Type**: `string`
  - **Description**: Name of the recorded room

- **`start_ts`**
  - **Type**: `integer`
  - **Description**: Unix timestamp of recording start

- **`status`**
  - **Type**: `enum`
  - **Options**: 
    - `"finished"`
    - `"in-progress"`
    - `"canceled"`

- **`max_participants`**
  - **Type**: `integer`
  - **Description**: Maximum number of participants during recording

- **`duration`**
  - **Type**: `integer`
  - **Description**: Approximate recording length in seconds

- **`tracks`**
  - **Type**: `array of objects`
  - **Description**: Raw tracks information (if applicable)

- **`s3key`**
  - **Type**: `string`
  - **Description**: Associated S3 key for the recording

- **`mtgSessionId`**
  - **Type**: `string`
  - **Description**: Meeting session ID

- **`isVttEnabled`**
  - **Type**: `boolean`
  - **Description**: Indicates WebVTT availability

### Example Request
```bash
GET /recordings?limit=50&starting_after=rec_123456
```

### Example Response
```json
{
  "total_count": 100,
  "data": [
    {
      "id": "rec_789012",
      "room_name": "daily_meeting_room",
      "start_ts": 1623456789,
      "status": "finished",
      "duration": 3600,
      "max_participants": 3,
      "s3key": "recordings/daily_meeting_room_123.mp4"
    }
  ]
}
```

### Best Practices
1. **Pagination**
   - Use `limit` to control response size
   - Implement cursor-based pagination
   - Handle large recording sets efficiently

2. **Recording Management**
   - Regularly review and manage recordings
   - Implement retention policies
   - Secure sensitive recording access

### Performance Considerations
- Large number of recordings can impact response time
- Use pagination to optimize data retrieval
- Consider caching recording metadata

### Potential Limitations
- Maximum of 100 recordings per request
- Limited filtering options
- Dependent on recording permissions

### Troubleshooting
- Verify authentication token
- Check network connectivity
- Validate pagination parameters
- Review Daily's recording documentation

### See Also
- [Daily Recordings Documentation](https://docs.daily.co/reference/recordings)
- [Authentication Guide](#)
- [Daily Transport Service](#daily-transport-service)

## Get Specific Recording

### Overview
Retrieve detailed information about a specific recording using its unique identifier.

### Endpoint Details
- **Method**: `GET`
- **Path**: `/recordings/{id}`

### Authentication
- **Type**: Bearer Authentication
- **Header**: `Authorization: Bearer <token>`
- **Description**: Requires a valid authentication token

### Path Parameters
- **`id`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: Unique identifier of the recording to retrieve

### Response Structure

#### Top-Level Response
- **`id`**
  - **Type**: `string`
  - **Description**: Unique, opaque ID for the recording
  - **Usage**: Can be used in API calls and pagination operations

- **`room_name`**
  - **Type**: `string`
  - **Description**: Name of the room where the recording was made

- **`start_ts`**
  - **Type**: `integer`
  - **Description**: Unix timestamp of recording start time
  - **Format**: Seconds since the epoch

- **`status`**
  - **Type**: `enum`
  - **Options**: 
    - `"finished"`
    - `"in-progress"`
    - `"canceled"`
  - **Description**: Current status of the recording

- **`duration`**
  - **Type**: `integer`
  - **Description**: Approximate length of the recording in seconds
  - **Note**: Not returned for in-progress recordings

- **`tracks`**
  - **Type**: `array of objects`
  - **Description**: Raw tracks information for raw-tracks recordings
  - **Note**: May be `null` if role permissions are removed

- **`s3key`**
  - **Type**: `string`
  - **Description**: Associated S3 key for the recording

- **`mtgSessionId`**
  - **Type**: `string`
  - **Description**: Unique meeting session ID

- **`isVttEnabled`**
  - **Type**: `boolean`
  - **Description**: Indicates WebVTT availability for the recording

- **`max_participants`**
  - **Type**: `integer`
  - **Description**: Maximum number of participants during the recorded meeting session

### Example Request
```bash
GET /recordings/rec_123456
```

### Example Response
```json
{
  "id": "rec_123456",
  "room_name": "daily_meeting_room",
  "start_ts": 1623456789,
  "status": "finished",
  "duration": 3600,
  "max_participants": 5,
  "s3key": "recordings/daily_meeting_room_123.mp4",
  "mtgSessionId": "mtg_789012",
  "isVttEnabled": true,
  "tracks": [
    {
      "track_id": "track_1",
      "participant_id": "participant_123"
    }
  ]
}
```

## Delete Recording

### Overview
Permanently delete a specific recording using its unique identifier.

### Endpoint Details
- **Method**: `DELETE`
- **Path**: `/recordings/{id}`

### Authentication
- **Type**: Bearer Authentication
- **Header**: `Authorization: Bearer <token>`
- **Description**: Requires a valid authentication token

### Path Parameters
- **`id`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: Unique identifier of the recording to delete

### Response Structure

#### Top-Level Response
- **`deleted`**
  - **Type**: `boolean`
  - **Description**: Indicates successful deletion of the recording
  - **Possible Values**: 
    - `true`: Recording successfully deleted
    - `false`: Deletion failed

- **`id`**
  - **Type**: `string`
  - **Description**: ID of the deleted recording

- **`s3_bucket`**
  - **Type**: `string`
  - **Description**: Name of the S3 bucket where the recording was stored
  - **Optional**: May not be present in all responses

- **`s3_region`**
  - **Type**: `string`
  - **Description**: AWS region of the S3 bucket
  - **Optional**: May not be present in all responses

- **`s3_key`**
  - **Type**: `string`
  - **Description**: S3 key of the deleted recording
  - **Optional**: May not be present in all responses

### Example Request
```bash
DELETE /recordings/rec_123456
```

### Example Response
```json
{
  "deleted": true,
  "id": "rec_123456",
  "s3_bucket": "daily-recordings",
  "s3_region": "us-west-2",
  "s3_key": "recordings/daily_meeting_room_123.mp4"
}
```

### Best Practices for Recording Management

1. **Retrieval**
   - Always use authentication
   - Handle different recording statuses
   - Check WebVTT availability if needed

2. **Deletion**
   - Verify the need for permanent deletion
   - Confirm authentication and permissions
   - Handle potential deletion failures gracefully

### Performance Considerations
- Retrieving individual recordings has minimal performance impact
- Deletion is a permanent action, use with caution
- Consider recording retention policies

### Potential Limitations
- Deleted recordings cannot be recovered
- Deletion depends on S3 bucket permissions
- WebVTT availability may vary

### Troubleshooting
- Verify authentication token
- Check recording ID validity
- Ensure sufficient permissions
- Review S3 bucket configuration

### See Also
- [Daily Recordings Documentation](https://docs.daily.co/reference/recordings)
- [Authentication Guide](#)
- [Recordings List Endpoint](#recordings-endpoint)

## Get Recording Access Link

### Overview
Create and retrieve a time-limited, cryptographically signed access link for a specific recording. This endpoint allows secure, temporary access to recording files.

### Endpoint Details
- **Method**: `GET`
- **Path**: `/recordings/{id}/access-link`

### Authentication
- **Type**: Bearer Authentication
- **Header**: `Authorization: Bearer <token>`
- **Description**: Requires a valid authentication token

### Path Parameters
- **`id`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: Unique identifier of the recording to generate an access link for

### Query Parameters
- **`valid_for_secs`**
  - **Type**: `integer`
  - **Default**: `3600` (1 hour)
  - **Description**: Duration in seconds for which the access link will remain valid
  - **Constraints**:
    - Minimum: 900 seconds (15 minutes)
    - Maximum: 43200 seconds (12 hours)
  - **Note**: Constrained by STS Token validity for recordings in customer buckets

- **`allow_streaming_from_bucket`**
  - **Type**: `boolean`
  - **Description**: Controls Content-Disposition header for custom S3 buckets
  - **Behavior**:
    - `true`: Sets to 'inline' - allows direct browser playback
    - `false`: Sets to 'attachment' - forces download
  - **Note**: Ignored for recordings in Daily's S3 bucket, which always use 'attachment'

### Response Structure

#### Top-Level Response
- **`download_link`**
  - **Type**: `string`
  - **Description**: Cryptographically signed, time-limited direct link to the .mp4 recording file
  - **Potential Values**:
    - Valid URL for downloading the recording
    - Error string (in certain error conditions)

- **`expires`**
  - **Type**: `integer`
  - **Description**: Unix timestamp indicating when the download link will expire
  - **Format**: Seconds since the epoch

### Example Requests
```bash
# Default access link (1-hour validity)
GET /recordings/rec_123456/access-link

# Custom validity duration (2 hours)
GET /recordings/rec_123456/access-link?valid_for_secs=7200

# Allow streaming from custom bucket
GET /recordings/rec_123456/access-link?allow_streaming_from_bucket=true
```

### Example Responses
```json
{
  "download_link": "https://s3.amazonaws.com/daily-recordings/rec_123456.mp4?X-Amz-Algorithm=...",
  "expires": 1623460389
}

{
  "download_link": "Error: Recording access not permitted",
  "expires": null
}
```

### Best Practices

1. **Link Management**
   - Request access links only when necessary
   - Use the shortest valid duration that meets your needs
   - Implement secure link distribution

2. **Streaming Considerations**
   - Use `allow_streaming_from_bucket=true` for browser playback
   - Use `allow_streaming_from_bucket=false` for secure downloads
   - Consider user experience and security requirements

3. **Error Handling**
   - Always check for potential error strings in `download_link`
   - Implement fallback mechanisms
   - Log and monitor access link generation attempts

### Performance Considerations
- Access link generation is a lightweight operation
- Link validity is time-limited for security
- Minimal computational overhead

### Potential Limitations
- Maximum link validity is 12 hours
- Minimum link validity is 15 minutes
- Access depends on recording and bucket permissions
- Potential restrictions based on domain properties

### Troubleshooting
- Verify authentication token
- Check recording ID validity
- Ensure sufficient permissions
- Validate link generation parameters
- Review domain recording access settings

### Security Considerations
- Cryptographically signed links provide temporary, secure access
- Time-limited links reduce risk of unauthorized access
- Custom bucket settings allow fine-grained access control

### Common Use Cases
- Sharing meeting recordings
- Providing temporary access to specific users
- Integrating recordings into external systems
- Implementing time-limited download workflows

### See Also
- [Daily Recordings Documentation](https://docs.daily.co/reference/recordings)
- [Authentication Guide](#)
- [Get Specific Recording](#get-specific-recording)
- [Recordings List Endpoint](#recordings-endpoint)

## Deepgram TTS Service

### Overview
[Deepgram](https://deepgram.com) offers advanced text-to-speech capabilities with natural-sounding voices.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `deepgram_tts`
- **Integration**: Fully Integrated

### Service Options
- **`voice`**
  - **Type**: `string`
  - **Default**: `"aura-asteria-en"`
  - **Description**: Select from available Deepgram TTS voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 24000, 32000, 48000

### Configuration Options
- **`voice`**: Select specific Deepgram voice
- **`text_filter`**: Control text filtering for improved speech generation

### Example Configuration
```json
{
  "service_options": {
    "deepgram": {
      "voice": "aura-orion-en"
    }
  }
}
```

### Best Practices
1. Explore different Aura voices
2. Use text filtering to improve speech clarity
3. Match voice to content context

### See Also
- [Deepgram TTS Documentation](https://deepgram.com/product/text-to-speech)

## ElevenLabs TTS Service

### Overview
[ElevenLabs](https://elevenlabs.io) provides highly customizable and expressive text-to-speech generation.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `elevenlabs`
- **Integration**: Fully Integrated

### Service Options
- **`voice`**
  - **Type**: `string`
  - **Default**: `"pFZP5JQG7iQjIQuC4Bku"`
  - **Description**: Select from available ElevenLabs voices

- **`output_format`**
  - **Type**: `string`
  - **Default**: `"pcm_24000"`
  - **Supported Values**: `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100`

### Advanced Configuration Options
- **`model`**: Select TTS model (e.g., Turbo V2.5)
- **`language`**: Specify speech language
- **`stability`**: Voice stability control
- **`similarity_boost`**: Voice similarity enhancement
- **`style`**: Fine-tune voice characteristics
- **`use_speaker_boost`**: Enhance speaker characteristics

### Emotion and Style Control
- Precise control over voice parameters
- Adjust stability, similarity, and style

### Example Configuration
```json
{
  "service_options": {
    "elevenlabs": {
      "voice": "Xb7hH8MSUJpSbSDYk0k2",
      "model": "eleven_turbo_v2_5"
    }
  }
}
```

### Best Practices
1. Use Turbo V2.5 for lowest latency
2. Experiment with voice stability and similarity
3. Leverage custom voice cloning

### See Also
- [ElevenLabs Voice Generation](https://elevenlabs.io)

## Google TTS Service

### Overview
[Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech) offers advanced speech synthesis with neural voices.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `google_tts`
- **Integration**: Bring Your Own (BYO) Keys
- **Requirement**: Google Cloud Platform account with Text-to-Speech API enabled

### Service Options
- **`voice`**
  - **Type**: `string`
  - **Default**: `"en-US-Neural2-A"`
  - **Description**: Select from available Google TTS voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 22050, 24000, 32000, 44100, 48000

### Authentication
Requires a service account JSON with credentials:
```json
{
 "type": "service_account",
 "project_id": "PROJECT_ID",
 "private_key_id": "PRIVATE_KEY_ID",
 "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

### Advanced Configuration
- **`language`**: Specify speech language
- **`pitch`**: Adjust voice pitch
- **`rate`**: Control speech rate
- **`volume`**: Modify audio volume
- **`emphasis`**: Fine-tune speech emphasis

### Example Configuration
```json
{
  "service_options": {
    "google_tts": {
      "voice": "en-US-Neural2-J",
      "language": "en-US"
    }
  }
}
```

### Best Practices
1. Use Neural voices for more natural speech
2. Match voice to content context
3. Secure service account credentials

### See Also
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)

## OpenAI TTS Service

### Overview
[OpenAI](https://openai.com) provides text-to-speech capabilities with a focus on clarity and naturalness.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `openai_tts`
- **Integration**: Bring Your Own (BYO) Keys

### Service Options
- **`voice`**
  - **Type**: `string`
  - **Default**: `"nova"`
  - **Description**: Select from available OpenAI voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: `24000`

### Configuration Options
- **`model`**: Choose TTS model
- **`voice`**: Select specific voice
- **`text_filter`**: Control text preprocessing

### Example Configuration
```json
{
  "service_options": {
    "openai_tts": {
      "voice": "nova",
      "model": "tts-1"
    }
  }
}
```

### Best Practices
1. Experiment with different voices
2. Use text filtering for cleaner output
3. Match voice to content style

### See Also
- [OpenAI TTS Documentation](https://platform.openai.com/docs/guides/text-to-speech)

## PlayHT TTS Service

### Overview
[PlayHT](https://play.ht) offers advanced text-to-speech with voice cloning and multilingual support.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `playht`
- **Integration**: Bring Your Own (BYO) Keys

### Service Options
- **`user_id`**
  - **Type**: `string`
  - **Required**: Yes
  - **Description**: PlayHT User ID from account settings

- **`voice`**
  - **Type**: `string`
  - **Description**: Select from available PlayHT voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 22050, 24000, 32000, 44100, 48000

### Advanced Configuration
- **`model`**: Select TTS model
- **`language`**: Specify speech language
- **`speed`**: Control speech rate
- **`seed`**: Control audio reproducibility

### Example Configuration
```json
{
  "service_options": {
    "playht": {
      "user_id": "$YOUR_PLAYHT_USER_ID",
      "voice": "s3://voice-cloning-zero-shot/voice-manifest.json",
      "model": "Play3.0-mini"
    }
  }
}
```

### Best Practices
1. Utilize voice cloning capabilities
2. Experiment with different models
3. Control speech reproducibility with seed

### See Also
- [PlayHT Voice Generation](https://play.ht)

## Rime TTS Service

### Overview
[Rime](https://rime.ai) provides text-to-speech with advanced voice generation capabilities.

### Service Details
- **Service Type**: Text-to-Speech
- **Configuration Key**: `rime`
- **Integration**: Bring Your Own (BYO) Keys

### Service Options
- **`voice`**
  - **Type**: `string`
  - **Default**: `"eva"`
  - **Description**: Select from available Rime voices

- **`sample_rate`**
  - **Type**: `integer`
  - **Default**: `24000`
  - **Supported Values**: 8000, 16000, 22050, 24000, 32000, 44100, 48000

### Configuration Options
- **`model`**: Choose TTS model (default: `"mist"`)
- **`text_filter`**: Control text preprocessing

### Example Configuration
```json
{
  "service_options": {
    "rime": {
      "voice": "rex",
      "model": "mist"
    }
  }
}
```

### Best Practices
1. Explore different voice options
2. Use text filtering for improved output
3. Match voice to content context

### See Also
- [Rime AI Voice Generation](https://rime.ai)
