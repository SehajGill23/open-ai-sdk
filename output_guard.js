import 'dotenv/config'
import { Agent, run, } from "@openai/agents"
import { z } from 'zod'


// 1. The import { keyof, output, z } from 'zod' is wrong: 'keyof' and 'output' are not zod exports (only 'z' is used).
// 2. There is an inconsistent naming of the outputType prop: isSafeToexecute should be isSafeToExecute (spelling mistake and inconsistent camelCase).
// 3. In the 'execute' function, the argument destructuring expects {sqlAgentQuery}, but it's unclear where this shape is coming from. In the agent run workflow, the outputGuardrail typically receives {output} or a similar structure (the property might just be 'sqlQuery').
// 4. tripwireTrigger is named here, but by convention and for compatibility with the @openai/agents API, this property should be called tripwireTriggered (note the 'ed' at the end).
// 5. There should be basic error handling for run failures.
// 6. The main function doesn't catch errors such as raised guardrails (i.e., InputGuardrailTripwireTriggered or OutputGuardrailTripwireTriggered).
// 7. Instructions string for the guardrail agent has some language issues and could be clearer.

const sqlGuardrailAgent = new Agent({
    name: "SQL Guardrail Agent",
    instructions: `Check if the provided SQL query is safe to execute. Only allow readonly SELECT queries that do not modify, delete, drop, or alter any table or data.`,
    outputType: z.object({
        reason: z.string().optional().describe('Reason if the query is unsafe.'),
        isSafeToExecute: z.boolean().describe('True if the query is safe to execute, false otherwise.')
    })
})

const sqlGuardrail = {
    name: 'SQL Guardrail',
    async execute({ agentOutput }) {
        const result = await run(sqlGuardrailAgent, agentOutput.sqlQuery)
        return {
            outputInfo: result.finalOutput.reason,
            tripwireTriggered: !result.finalOutput.isSafeToExecute
        }
    },
}

const sqlAgent = new Agent({
    name: "SQL Expert Agent",
    instructions: `You are an expert SQL agent specialized in generating SQL queries as per user requests.

Postgres Schema: 
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
    `,
    outputType: z.object({
        sqlQuery: z.string().describe('SQL query')
   
    }),
    outputGuardrails: [sqlGuardrail]
})

async function main(q = '') {
    try {
        const result = await run(sqlAgent, q);
        console.log('Query:', result.finalOutput.sqlQuery);
    } catch (e) {
        // Properly handle tripwire (guardrail) triggers
        if (e.name && e.name.includes('GuardrailTripwireTriggered')) {
            console.error(`Query blocked by guardrail: ${e.message}`);
        } else {
            console.error('Unexpected error:', e);
        }
    }
}

main("Get me list all the user names")