import { Agent, run, tool } from '@openai/agents';
import {z} from 'zod';
import 'dotenv/config';


const agent = new Agent({
  name: 'Storyteller',
  instructions:
    'You are a storyteller. You will be given a topic and you will tell a story about it.',
});


async function main(q: string) {
    const result = await run(agent, q, {
        stream: true,
      });
    result.toTextStream({compatibleWithNodeStreams: true}).pipe(process.stdout);
}


main("Write a short story about lord rama.")