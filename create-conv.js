import { Agent, run, tool } from '@openai/agents';
import {z} from 'zod';
import 'dotenv/config';
import {OpenAI} from "openai"

const client = new OpenAI()

client.conversations.create({}).then((e)=> {
    console.log(`Conversation Thread Created: ${e.id}`)
})

//conv_6adea4951edc81909493b75e97684b1f0041aab3e49608d4

