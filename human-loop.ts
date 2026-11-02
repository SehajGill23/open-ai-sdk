import { Agent, run, tool } from '@openai/agents';
import readline from 'node:readline/promises';
import { z } from 'zod';
import 'dotenv/config';
import axios from 'axios';
import { is } from 'zod/locales';
import { waitForDebugger } from 'node:inspector';

// ============================================================================
// OPENAI AGENTS SDK: HUMAN-IN-THE-LOOP (HITL) WORKFLOWS
// ============================================================================
// The `interruptions` array is used to handle critical agent actions that 
// require explicit human authorization (e.g., sending emails, database writes).
//
// HOW IT WORKS:
//
// 1. TRIGGERING THE INTERRUPTION
//    Mark a specific tool with an approval rule (e.g., `needsApproval: true`).
//
// 2. PAUSING EXECUTION
//    When the agent tries to call this tool, the SDK automatically pauses 
//    execution at the end of the turn and creates a `RunToolApprovalItem`.
//
// 3. THE ARRAY SURFACE
//    The SDK returns a `RunResult` object containing an `interruptions` array.
//    This array holds all pending tool calls blocked and waiting for user review.
// ============================================================================



//function tool
const getWeather = tool({
    name: 'getWeather',
    description: 'Get the weather information of all the given locations',
    parameters: z.object({
        city: z.string().describe('name of the city')
    }),
    execute: async function ({ city }) { //this is the actual function that runs, and takes the parameter city that we defined in the aboev object as parameter city.

        //TODO: Replace this with an actual weather api call, we are hardcoding it for learning rn. 
        // return `The weather of ${city} is sunnt with the wind`

        const url = `https://wttr.in/${city.toLowerCase()}?format=%c+%t`
        const respone = await axios.get(url, { responseType: 'text' })
        return `The weather of ${city} is ${respone.data}`
    }
});

const sendEmailTool = tool({
    name: "send_email",
    description: 'Send the email to the users provided email address about the weather details',
    parameters: z.object({
        to: z.string().describe('to email address'),
        subject: z.string().describe('email subject'),
        html: z.string().describe('html body of the email'),
    }),
    // we added a human involvement in the agentic flow, which is to ask for permission to send an email, 
    // which makes an object in the interupption array which holds all pending tool calls blocked and waiting for user review.
    needsApproval: true,
    execute: async ({ to, subject, html }) => {
        const resend = process.env.RESEND_API_KEY

        if (!resend) {
            throw new Error('RESEND_API_KEY is missing from .env');
        }
        try {
            const response = axios.post("https://api.resend.com/emails",
                {
                    from: 'AI SDK<contact@sehaj.dev>',
                    to: [to],
                    subject: subject,
                    html: html,
                },

                {
                    headers: {
                        "Authorization": `Bearer ${resend}`,
                        'Content-Type': 'application/json',
                    }
                })

            return (await response).data;

        } catch (e: any) {
            return `The Error is: ${JSON.stringify(e.response?.data ?? e.message)}`;
        }

    }
})

const weatherAgent = new Agent({
    name: 'Weather Agent',
    instructions: 'You are a helpful assistant that tells the weather',
    tools: [getWeather, sendEmailTool],
    model: 'gpt-4o-mini',
});



const askForUserConfirmation = async (question: string) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await rl.question(`${question} (y/n): `);
    const normalizedAnswer = answer.toLowerCase();
    rl.close();
    // Can also be wriiten as: 
    //   if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
    //     return true;
    // } else {
    //     return false;
    // }
    return normalizedAnswer === 'y' || normalizedAnswer === 'yes';

}


const main = async (q: string) => {
    let result = await run(weatherAgent, q);

    // result.interruptions is an array, which has objects when an approval is required.
    let hasIntruption = (await result).interruptions.length > 0

    // while the array has interupptions we do this: 
    while (hasIntruption) {
        const currentState = (await result).state //this is the full state object, that we store in a variable
        for (const i of (await result).interruptions) { //iterate on each interruptions
            if (i.type == "tool_approval_item") { //if an interruption object has type tool_approval_item
                const isAllowed = await askForUserConfirmation(
                    `Agent ${i.agent.name} is asking for calling tool ${i.agent.name} with args ${i.arguments}`
                );

                if (isAllowed) {
                    currentState.approve(i) // we approve the current state, by passing an interupption object as a parameter.
                    console.log(`The instructions were approved!`)
                } else {
                    currentState.reject(i)
                    console.log(`The instructions were rejected!`)
                }

                result = await run(weatherAgent, currentState)
                hasIntruption = result.interruptions?.length > 0
            }
        }
    }
}



main("Can u tell me the weather of Vancouver, and email it to me at gillsehaj604@gmail.com, if you are unable to send the email, please mention the exact error")