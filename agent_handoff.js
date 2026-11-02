import 'dotenv/config'
import { Agent, tool, run } from "@openai/agents"
import { z } from 'zod'
import fs from "node:fs/promises"
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';


// ------------------------------tools----------------------------------
const fetchAvailiblePlans = tool({
    name: 'fetch_Availible_Plans',
    description: 'Fetches the availible plans for internet',
    parameters: z.object({}), // no parmaters for now
    execute: async function () {
        //Sample Data for now, relaistically it comes out of our db
        return [
            { plan_id: '1', price_cad: 38, speed: '30MB/s' },
            { plan_id: '2', price_cad: 58, speed: '60MB/s' },
            { plan_id: '3', price_cad: 68, speed: '100MB/s' }
        ]
    }
})


const processRefund = tool({
    name: 'process_refund',
    description: 'This tool process the refunds for a customer',
    parameters: z.object({
        customerId: z.string().describe('id of the customer'),
        reasonForRefund: z.string().describe('Reason for the refund')
    }),
    execute: async function ({customerId, reasonForRefund}) {
        await fs.appendFile(
            './refunds.txt',
            `Refund for Customer id ${customerId} for ${reasonForRefund} \n`,
            'utf-8'
        )
        return { refundIssued: true };
    },
});



//---------------------------Agents --------------------------------------------




//----------Guardrails(Task Agent)--------------
const refundAgent = new Agent({
    name: 'Refund Agent',
    instructions: 'You are expert in issuing refunds to customer',
    tools: [processRefund],
    model: 'gpt-4o-mini',
})


const salesAgent = new Agent({
    name: 'Sales Agent',
    instructions: `
    You are an expert Sales agent for an internet broadband company.
    Talk to the user and help them with what they need`,
    tools: [fetchAvailiblePlans,
            refundAgent.asTool ({ //uses refundAgent as a tool
                toolName: "refund_agent",
                toolDescription: "Handles refund requests"
            })
    ],
    model: 'gpt-4o-mini'
})



//--------------HandOff Agent-------------------------------
const receptionAgent = new Agent({
    name: 'Reception Agent',
    instructions: `You are a customer Facing agent expert in understanding what the customer needs and then route them or handoff them to the right agent.`,
    handoffDescription: `
    ${RECOMMENDED_PROMPT_PREFIX}
    You have two agents availible:
    - salesAgent: Expert in handling queries about different internet broadband plans including pricing (Good for new customers), 
    - refundAgent: Expert in handling user queries for existing customers and issue refunds if they are unsatisfied with their current plan.`,
    handoffs: [salesAgent, refundAgent]
})



async function main (Query = '') {
    const result = await run(receptionAgent, Query);
    console.log("Result", result.finalOutput)
    console.log("History", result.history)
}



//----main----
main(
    `'Hey, I am an existing customer and I have a plan with you guys, however I do not remember the price of my plan but I am sure it was more than 50 and less than 60, and I am looking for a refund as I am unsatisfied with the speed. 
    Can you please tell me what plan price it was and please initiate a refund to the original closely matching plan price that I do not remember'`
)