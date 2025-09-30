import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    },
);

export const llmModel = inngest.createFunction(
    { id: 'llm-model' },
    { event: 'llm-model' },
    async ({ event, step }) => {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            console.error('Gemini API key is not configured');
            return { error: 'Gemini API key not configured' };
        }

        try {
            const aiResp = await step.ai.infer('generate-ai-llm-model-call', {
                model: step.ai.models.gemini({
                    model: 'gemini-2.0-flash-exp-image-generation',
                    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY
                }),
                body: {
                    contents: [
                        {
                            role: 'assistant',
                            parts: [
                                {
                                    text: 'Depends on user input sources, Summerize and search about topic, Give e markdowb text with proper formatting. User Input is:'
                                        + event.data.searchInput
                                }
                            ]
                        },
                        {
                            role: "user",
                            parts: [
                                {
                                    text: JSON.stringify(event.data.searchResult)
                                }
                            ]
                        }
                    ]
                }
            })

            if (!isSupabaseConfigured()) {
                console.warn('Supabase is not configured. Skipping database save.');
                return aiResp;
            }

            const saveToDb = await step.run('saveToDb', async () => {
                console.log(aiResp)
                const { data, error } = await supabase
                    .from('Chats')
                    .update({ aiResp: aiResp?.candidates[0].content.parts[0].text })
                    .eq('id', event.data.recordId)
                    .select()

                if (error) {
                    console.error('Error saving to database:', error);
                }

                return aiResp;
            })

            return saveToDb;
        } catch (error) {
            console.error('Error in llmModel function:', error);
            return { error: error.message };
        }
    }
)
