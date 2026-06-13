# Microsoft Foundry Setup

## Configuration

1. Log into your Azure Portal.
2. Navigate to **Azure OpenAI Studio**.
3. Create a new deployment using an approved LLM (e.g., GPT-4o).
4. Extract your Endpoint URL and API Key.

## Integration

Update your `.env` file or host variables with:

```env
AZURE_AI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_AI_API_KEY=your_secret_key
AZURE_AI_MODEL=your_deployment_name
```

The system will automatically switch from Demo Mode to live Foundry mode once these environment variables are populated.
