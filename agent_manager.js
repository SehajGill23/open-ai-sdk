import 'dotenv/config'
import { Agent, tool, run } from "@openai/agents"
import { z } from 'zod'
import fs from "node:fs/promises"

//---------------------------------------Manager Pattern------------------------------------------


// +------------------+----------------------------------+----------------------------------+
// | Pattern          | How it works                     | Best when                        |
// +------------------+----------------------------------+----------------------------------+
// | **Agents as      | Manager keeps control and calls  | One agent owns final answer,     |
// | tools**          | specialists via                  | combines outputs, or enforces    |
// |                  | `agent.asTool()`.                | shared guardrails in one place.  |
// +------------------+----------------------------------+----------------------------------+



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

//----------Task Agent--------------
const refundAgent = new Agent({
    name: 'Refund Agent',
    instructions: 'You are expert in issuing refunds to customer',
    tools: [processRefund],
    model: 'gpt-4o-mini',
})


//-------------Manager---------------
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




//----------------------------Main----------------------------------
const runSalesAgent = async (query = '') => {
    const result = await run(salesAgent, query);
    console.log(result.finalOutput);
}

runSalesAgent('Hey there i had a plane for 50 something cad I dont remeber the exact plan that I got it was somewhere around 50, I do not like this plan as the speed is preety low so I am looking forward to change it, and I am looking for a refund my customer id is Sehaj01.'); 