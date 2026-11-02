import { Agent, run, tool } from '@openai/agents';
import {z} from 'zod';
import 'dotenv/config';

// create an array, to keep context for the agent, which works as a thread.
// we are just simulating a db, it won't be like this in production ready agentic flows
let sharedHistory = [];

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
    //store the message given by the user in an array/thread
    sharedHistory.push({role: 'user', content: Query});

    const result = await run(sqlAgent, sharedHistory); // run the agent from the query from the thread/array

    sharedHistory = result.history; // append the history of the result 

    console.log('Final Output', result.finalOutput);
}

main("Hi My name is Sehaj!.").then(() => {
    main(" get all the users with my name that I told u before")
})