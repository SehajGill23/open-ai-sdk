import { Agent, run, tool, RunContext } from '@openai/agents';
import {z} from 'zod';
import 'dotenv/config';
import { cp } from 'node:fs';

interface myContext {
    userId: string,
    userName: string,
    getUserInfo(): Promise<string | undefined>
}

const getUserInfoTool = tool({
    name: 'Get user_info',
    description: 'Get the user info',
    parameters: z.object({}),
    execute: async (_, context?: RunContext<myContext>): Promise<String> => {
    // this way agent will have the agent context / LLM Context, which is different from runtime context, this LLM/Agent Context helps the LLM to Reason
        return `Context = ${context?.context.getUserInfo}`
    }
})

const customerSupportAgent = new Agent<myContext>({
    name: "Customer Support Agent",
    instructions:  `You are an expert customer support agent`,
    tools: [getUserInfoTool]
})

async function main (query: string, context: myContext){
    const result = await run(customerSupportAgent, query, {
        context: context
    });
    console.log(`Result: `, result.finalOutput)
}

// passing run time context in the agent loop, so the agent knows 
// what tools/instructions are supposed to be run for a specific
// user that helps the tools/instructions to tailor their output 
// to a specific user's active session

// For example, an agent's tool could use an authentication token from
// runtime context to retrieve a private repository, without ever exposing that token to the model.

// Important: Runtime context does not automatically make an agent smarter 
// or remember previous conversations. It makes relevant execution data available. 
// Your code still decides what to expose to the model and what to keep private.

main("Hey What is my name?", {userId: "01", userName: "Sehaj", 
    getUserInfo: async () => {'UserID=1, name=sg'}
 } )