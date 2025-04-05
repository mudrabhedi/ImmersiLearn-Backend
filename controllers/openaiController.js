import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const fetchStory = async () => {
  const response = await client.completions.create({
    model: "gpt-4",
    prompt: "Write a one-sentence bedtime story about a unicorn.",
  });
  return response.choices[0].text;
};