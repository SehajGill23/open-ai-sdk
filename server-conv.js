import { Agent, run, tool } from '@openai/agents';
import {z} from 'zod';
import 'dotenv/config';

const executeSQL = tool({
    name: "execute_sql",
    description: "This tool executes the SQL Query",
    parameters: z.object({
        sql: z.string().describe(`The Sql Query`)
    }),
    execute: async function ({sql}) {
        console.log(`[SQL]: Execute ${sql}`)
        return 'done'
    }
})

const sqlAgent = new Agent({
    name: "SQL Expert Agent",
    tools: [executeSQL],
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
    `
})


const main = async (Query = '') => {

    const result = await run(sqlAgent, Query, {
        conversationId: 'conv_6adea4951edc81909493b75e97684b1f0041aab3e49608d4' // we created this id in create-conv.js, and we can see the conversation in openai dashboard.
    }); // run the agent from the query from the thread/array

    console.log('Final Output', result.finalOutput);
}

main("Can u write a query to run to get all the suers same as my name")
// .then(() => {
//     main(" get all the users with my name that I told u before")
// })