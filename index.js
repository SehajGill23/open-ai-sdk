import { Agent, run } from '@openai/agents';
import 'dotenv/config';

const locationIndia = 'India'
const locationUSA = 'USA'

const instructions = (location) => {

  if (location === locationIndia) {
    return 'Namaste, how are you?';
  } else if (location === locationUSA) {
    return 'Hey,Whats up?';
  } else {
    return 'Hello, how are you?';
  }
}

const hellowAgent = new Agent({
  name: 'Hello Agent',
  description: 'A agent that says hello',
  instructions: instructions(locationIndia),
  tools: [],
  model: 'gpt-4o-mini',
});

//2nd parameter is the input to the agent. then is used to wait for the result.
run(hellowAgent, 'Hey, there my name is Sehaj!').then((result) => console.log(result.finalOutput)); //output: Hello, how are you?