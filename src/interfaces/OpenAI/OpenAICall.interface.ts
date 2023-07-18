import { ChatCompletionRequestMessage, CreateCompletionRequestPrompt, CreateCompletionRequestStop } from 'openai';

export interface OpenAICallInterface {
  'apiKey'?: string | undefined;
  'orgId'?: string | undefined;
  /**
   * ID of the model to use. You can use the List models API to see all of your available models, or see our Model overview for descriptions of them.
   * @type {string}
   * @memberof OpenAICallInterface
   */
  'model'?: string | 'text-davinci-003';
  /**
   * The prompt(s) to generate completions for,
   * encoded as a string, array of strings, array of tokens, or array of token arrays.
   * @type {CreateCompletionRequestPrompt}
   * @memberof OpenAICallInterface
   */
  'prompt'?: CreateCompletionRequestPrompt | undefined;
  /**
   * A list of messages comprising the conversation so far.
   * [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb).
   *
   * @type {Array<ChatCompletionRequestMessage>}
   * @memberof OpenAICallInterface
   */
  'messages'?: Array<ChatCompletionRequestMessage>;
  /**
   * The suffix that comes after a completion of inserted text.
   * @type {string}
   * @memberOf OpenAICallInterface
   */
  'suffix'?: string | undefined;
  /**
   * The maximum number of [tokens](/tokenizer) to generate in the completion.
   * The token count of your prompt plus `max_tokens` cannot exceed the model\'s
   * context length.
   * [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb) for counting tokens.
   * @type {number}
   * @memberOf OpenAICallInterface
   */
  'max_tokens'?: number | undefined;
  /**
   * What sampling temperature to use, between 0 and 2.
   * Higher values like 0.8 will make the output more random,
   * while lower values like 0.2 will make it more focused and deterministic.
   * We generally recommend altering this or `top_p` but not both.
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'temperature'?: number | .7;
  /**
   * An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.  We generally recommend altering this or `temperature` but not both.
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'top_p'?: number | undefined;
  /**
   * How many completions to generate for each prompt.
   *
   * **Note:** Because this parameter generates many completions, it can quickly consume your token quota.
   * Use carefully and ensure that you have reasonable settings for `max_tokens` and `stop`.
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'n'?: number | undefined;
  /**
   * Whether to stream back partial progress. If set, tokens will be sent as data-only
   * [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format) as they become available, with the stream terminated by a `data: [DONE]` message. [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_stream_completions.ipynb).
   * @type {boolean}
   * @memberof OpenAICallInterface
   */
  'stream'?: boolean | undefined;
  /**
   * Include the log probabilities on the `logprobs` most likely tokens, as well the chosen tokens.
   * For example, if `logprobs` is 5, the API will return a list of the 5 most likely tokens.
   * The API will always return the `logprob` of the sampled token, so there may be up to `logprobs+1`
   * elements in the response.  The maximum value for `logprobs` is 5.
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'logprobs'?: number | undefined;
  /**
   * Echo back the prompt in addition to the completion
   * @type {boolean}
   * @memberof OpenAICallInterface
   */
  'echo'?: boolean | false;
  /**
   *
   * @type {CreateCompletionRequestStop}
   * @memberof OpenAICallInterface
   */
  'stop'?: CreateCompletionRequestStop | undefined;
  /**
   * Number between -2.0 and 2.0.
   * Positive values penalize new tokens based on whether they appear in the text so far,
   * increasing the model\'s likelihood to talk about new topics.
   * [See more information about frequency and presence penalties.](/docs/api-reference/parameter-details)
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'presence_penalty'?: number | undefined;
  /**
   * Number between -2.0 and 2.0.
   * Positive values penalize new tokens based on their existing frequency in the text so far,
   * decreasing the model\'s likelihood to repeat the same line verbatim.
   * [See more information about frequency and presence penalties.](/docs/api-reference/parameter-details)
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'frequency_penalty'?: number | undefined;
  /**
   * Generates `best_of` completions server-side and returns the \"best\"
   * (the one with the highest log probability per token). Results cannot be streamed.
   * When used with `n`, `best_of` controls the number of candidate completions
   * and `n` specifies how many to return – `best_of` must be greater than `n`.
   *
   * **Note:** Because this parameter generates many completions, it can quickly consume your token quota.
   * Use carefully and ensure that you have reasonable settings for `max_tokens` and `stop`.
   * @type {number}
   * @memberof OpenAICallInterface
   */
  'best_of'?: number | undefined;
  /**
   * Modify the likelihood of specified tokens appearing in the completion.
   * Accepts a json object that maps tokens (specified by their token ID in the GPT tokenizer)
   * to an associated bias value from -100 to 100.
   * You can use this [tokenizer tool](/tokenizer?view=bpe) (which works for both GPT-2 and GPT-3) to convert text to token IDs.
   * Mathematically, the bias is added to the logits generated by the model prior to sampling.
   * The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection;
   * values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
   * As an example, you can pass `{\"50256\": -100}` to prevent the <|endoftext|> token from being generated.
   * @type {object}
   * @memberof OpenAICallInterface
   */
  'logit_bias'?: object | null;
  /**
   * A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.
   * [Learn more](/docs/guides/safety-best-practices/end-user-ids).
   * @type {string}
   * @memberof OpenAICallInterface
   */
  'user'?: string;
}
